import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { env, getEnvironmentSearchDirectories } from '../config/env.js';

type DocumentData = Record<string, unknown>;
type CollectionMap = Record<string, Record<string, DocumentData>>;
type WhereOperator = '==' | '>=' | '<=' | '>' | '<';

interface StoreFile {
  version: 1;
  updatedAt: string;
  collections: CollectionMap;
}

interface WhereFilter {
  field: string;
  operator: WhereOperator;
  value: unknown;
}

interface OrderClause {
  field: string;
  direction: 'asc' | 'desc';
}

export interface DocumentSetOptions {
  merge?: boolean;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createEmptyStore(): StoreFile {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    collections: {},
  };
}

function resolveStoreFilePath(): string | null {
  if (env.DATA_STORE_FILE.trim()) {
    return path.resolve(env.DATA_STORE_FILE);
  }

  if (env.NODE_ENV === 'test') {
    return null;
  }

  const repoRoot = getEnvironmentSearchDirectories(process.cwd())[0];
  return path.join(repoRoot, '.data', 'api-store.json');
}

function compareValues(left: unknown, right: unknown): number {
  if (left === right) return 0;
  if (left == null) return -1;
  if (right == null) return 1;
  return String(left).localeCompare(String(right));
}

function matchesFilter(data: DocumentData, filter: WhereFilter): boolean {
  const actual = data[filter.field];
  const comparison = compareValues(actual, filter.value);

  if (filter.operator === '==') return actual === filter.value;
  if (filter.operator === '>=') return comparison >= 0;
  if (filter.operator === '<=') return comparison <= 0;
  if (filter.operator === '>') return comparison > 0;
  return comparison < 0;
}

class JsonDocumentStoreRuntime {
  private readonly filePath = resolveStoreFilePath();
  private loaded = false;
  private store: StoreFile = createEmptyStore();
  private mutationQueue: Promise<void> = Promise.resolve();

  collection(pathValue: string): DocumentCollection {
    return new DocumentCollection(this, pathValue);
  }

  batch(): DocumentWriteBatch {
    return new DocumentWriteBatch();
  }

  async runTransaction<T>(callback: (transaction: DocumentTransaction) => Promise<T>): Promise<T> {
    return this.mutate(async () => {
      const transaction = new DocumentTransaction();
      const result = await callback(transaction);
      transaction.commit();
      return result;
    });
  }

  async mutate<T>(callback: () => Promise<T> | T): Promise<T> {
    const operation = this.mutationQueue.then(async () => {
      this.ensureLoaded();
      const result = await callback();
      await this.flush();
      return result;
    });

    this.mutationQueue = operation.then(
      () => undefined,
      () => undefined,
    );

    return operation;
  }

  getCollection(pathValue: string): Record<string, DocumentData> {
    this.ensureLoaded();
    if (!this.store.collections[pathValue]) {
      this.store.collections[pathValue] = {};
    }

    return this.store.collections[pathValue];
  }

  resetForTests(): void {
    this.store = createEmptyStore();
    this.loaded = true;
  }

  private ensureLoaded(): void {
    if (this.loaded) {
      return;
    }

    if (!this.filePath || !fs.existsSync(this.filePath)) {
      this.store = createEmptyStore();
      this.loaded = true;
      return;
    }

    const parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf8')) as StoreFile;
    this.store = {
      version: 1,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      collections: parsed.collections ?? {},
    };
    this.loaded = true;
  }

  private async flush(): Promise<void> {
    this.store.updatedAt = new Date().toISOString();
    if (!this.filePath) {
      return;
    }

    await fs.promises.mkdir(path.dirname(this.filePath), { recursive: true });
    const tempFile = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    await fs.promises.writeFile(tempFile, `${JSON.stringify(this.store, null, 2)}\n`, 'utf8');
    await fs.promises.rename(tempFile, this.filePath);
  }
}

const runtime = new JsonDocumentStoreRuntime();

export class DocumentSnapshot {
  constructor(
    public readonly ref: DocumentReference,
    public readonly id: string,
    private readonly value: DocumentData | null,
  ) {}

  get exists(): boolean {
    return this.value !== null;
  }

  data(): DocumentData | undefined {
    return this.value ? clone(this.value) : undefined;
  }

  get(field: string): unknown {
    return this.value?.[field];
  }
}

export class QuerySnapshot {
  constructor(public readonly docs: DocumentSnapshot[]) {}

  get empty(): boolean {
    return this.docs.length === 0;
  }

  get size(): number {
    return this.docs.length;
  }
}

export class CountSnapshot {
  constructor(private readonly value: number) {}

  data(): { count: number } {
    return { count: this.value };
  }
}

export class DocumentReference {
  constructor(
    private readonly runtimeRef: JsonDocumentStoreRuntime,
    private readonly collectionPath: string,
    public readonly id: string,
  ) {}

  collection(name: string): DocumentCollection {
    return new DocumentCollection(this.runtimeRef, `${this.collectionPath}/${this.id}/${name}`);
  }

  async get(): Promise<DocumentSnapshot> {
    return this.snapshot();
  }

  async set(data: DocumentData, options: DocumentSetOptions = {}): Promise<void> {
    await this.runtimeRef.mutate(() => {
      this.applySet(data, options);
    });
  }

  async update(data: DocumentData): Promise<void> {
    await this.runtimeRef.mutate(() => {
      this.applyUpdate(data);
    });
  }

  async delete(): Promise<void> {
    await this.runtimeRef.mutate(() => {
      this.applyDelete();
    });
  }

  snapshot(): DocumentSnapshot {
    const collection = this.runtimeRef.getCollection(this.collectionPath);
    const value = collection[this.id] ?? null;
    return new DocumentSnapshot(this, this.id, value ? clone(value) : null);
  }

  applySet(data: DocumentData, options: DocumentSetOptions = {}): void {
    const collection = this.runtimeRef.getCollection(this.collectionPath);
    const existing = collection[this.id] ?? {};
    collection[this.id] = options.merge ? { ...existing, ...clone(data) } : clone(data);
  }

  applyUpdate(data: DocumentData): void {
    const collection = this.runtimeRef.getCollection(this.collectionPath);
    if (!collection[this.id]) {
      throw new Error(`Document ${this.collectionPath}/${this.id} does not exist`);
    }

    collection[this.id] = {
      ...collection[this.id],
      ...clone(data),
    };
  }

  applyDelete(): void {
    const collection = this.runtimeRef.getCollection(this.collectionPath);
    delete collection[this.id];
  }
}

export class DocumentQuery {
  constructor(
    protected readonly runtimeRef: JsonDocumentStoreRuntime,
    protected readonly collectionPath: string,
    private readonly filters: WhereFilter[] = [],
    private readonly orderClause: OrderClause | null = null,
    private readonly limitCount: number | null = null,
    private readonly offsetCount = 0,
  ) {}

  where(field: string, operator: WhereOperator, value: unknown): DocumentQuery {
    return new DocumentQuery(
      this.runtimeRef,
      this.collectionPath,
      [...this.filters, { field, operator, value }],
      this.orderClause,
      this.limitCount,
      this.offsetCount,
    );
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): DocumentQuery {
    return new DocumentQuery(
      this.runtimeRef,
      this.collectionPath,
      this.filters,
      { field, direction },
      this.limitCount,
      this.offsetCount,
    );
  }

  limit(count: number): DocumentQuery {
    return new DocumentQuery(
      this.runtimeRef,
      this.collectionPath,
      this.filters,
      this.orderClause,
      count,
      this.offsetCount,
    );
  }

  offset(count: number): DocumentQuery {
    return new DocumentQuery(
      this.runtimeRef,
      this.collectionPath,
      this.filters,
      this.orderClause,
      this.limitCount,
      count,
    );
  }

  count(): { get: () => Promise<CountSnapshot> } {
    return {
      get: async () => new CountSnapshot((await this.get()).size),
    };
  }

  async get(): Promise<QuerySnapshot> {
    const collection = this.runtimeRef.getCollection(this.collectionPath);
    let entries = Object.entries(collection).filter(([, data]) =>
      this.filters.every((filter) => matchesFilter(data, filter)),
    );

    if (this.orderClause) {
      const { field, direction } = this.orderClause;
      entries = entries.sort(([, left], [, right]) => {
        const result = compareValues(left[field], right[field]);
        return direction === 'desc' ? -result : result;
      });
    }

    entries = entries.slice(this.offsetCount, this.limitCount ? this.offsetCount + this.limitCount : undefined);
    return new QuerySnapshot(
      entries.map(([id, data]) => new DocumentSnapshot(new DocumentReference(this.runtimeRef, this.collectionPath, id), id, clone(data))),
    );
  }
}

export class DocumentCollection extends DocumentQuery {
  doc(id: string): DocumentReference {
    return new DocumentReference(this.runtimeRef, this.collectionPath, id);
  }

  async add(data: DocumentData): Promise<DocumentReference> {
    const ref = this.doc(crypto.randomUUID());
    await ref.set(data);
    return ref;
  }
}

export class DocumentWriteBatch {
  private readonly writes: Array<() => void> = [];

  set(ref: DocumentReference, data: DocumentData, options: DocumentSetOptions = {}): void {
    this.writes.push(() => ref.applySet(data, options));
  }

  async commit(): Promise<void> {
    await runtime.mutate(() => {
      this.writes.forEach((write) => write());
    });
  }
}

export class DocumentTransaction {
  private readonly writes: Array<() => void> = [];

  async get(target: DocumentReference): Promise<DocumentSnapshot>;
  async get(target: DocumentQuery): Promise<QuerySnapshot>;
  async get(target: DocumentReference | DocumentQuery): Promise<DocumentSnapshot | QuerySnapshot> {
    return target.get();
  }

  set(ref: DocumentReference, data: DocumentData, options: DocumentSetOptions = {}): void {
    this.writes.push(() => ref.applySet(data, options));
  }

  delete(ref: DocumentReference): void {
    this.writes.push(() => ref.applyDelete());
  }

  commit(): void {
    this.writes.forEach((write) => write());
  }
}

export function getDocumentStore(): JsonDocumentStoreRuntime {
  return runtime;
}

export function resetDocumentStoreForTests(): void {
  runtime.resetForTests();
}
