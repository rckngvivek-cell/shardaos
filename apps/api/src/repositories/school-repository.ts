import type {
  CreateSchoolInput,
  School,
  SchoolQuery,
  UpdateSchoolInput
} from '../models/schools';

export interface SchoolRepository {
  create(input: CreateSchoolInput): Promise<string>;
  get(schoolId: string): Promise<School | null>;
  update(schoolId: string, input: UpdateSchoolInput): Promise<School | null>;
  list(query: SchoolQuery): Promise<{ schools: School[]; total: number }>;
  delete(schoolId: string): Promise<boolean>;
}
