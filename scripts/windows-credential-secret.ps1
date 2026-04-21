param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('get', 'set', 'delete')]
  [string]$Action,

  [Parameter(Mandatory = $true)]
  [string]$Target,

  [string]$Secret,

  [string]$UserName = 'bootstrap'
)

$ErrorActionPreference = 'Stop'

if (-not ([System.Management.Automation.PSTypeName]'CredManager.NativeMethods').Type) {
  Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;

namespace CredManager {
  public static class NativeMethods {
    public const int CRED_TYPE_GENERIC = 1;
    public const int CRED_PERSIST_LOCAL_MACHINE = 2;

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CREDENTIAL {
      public UInt32 Flags;
      public UInt32 Type;
      public string TargetName;
      public string Comment;
      public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
      public UInt32 CredentialBlobSize;
      public IntPtr CredentialBlob;
      public UInt32 Persist;
      public UInt32 AttributeCount;
      public IntPtr Attributes;
      public string TargetAlias;
      public string UserName;
    }

    [DllImport("Advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);

    [DllImport("Advapi32.dll", EntryPoint = "CredWriteW", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool CredWrite(ref CREDENTIAL userCredential, uint flags);

    [DllImport("Advapi32.dll", EntryPoint = "CredDeleteW", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool CredDelete(string target, int type, int flags);

    [DllImport("Advapi32.dll", SetLastError = true)]
    public static extern void CredFree(IntPtr cred);

    public static string ReadSecret(string target) {
      IntPtr credentialPtr;
      if (!CredRead(target, CRED_TYPE_GENERIC, 0, out credentialPtr)) {
        throw new InvalidOperationException("CredRead failed: " + Marshal.GetLastWin32Error());
      }

      try {
        var credential = (CREDENTIAL)Marshal.PtrToStructure(credentialPtr, typeof(CREDENTIAL));
        if (credential.CredentialBlob == IntPtr.Zero || credential.CredentialBlobSize == 0) {
          return string.Empty;
        }

        var secretBytes = new byte[credential.CredentialBlobSize];
        Marshal.Copy(credential.CredentialBlob, secretBytes, 0, (int)credential.CredentialBlobSize);
        return Encoding.Unicode.GetString(secretBytes).TrimEnd('\0');
      } finally {
        CredFree(credentialPtr);
      }
    }

    public static void WriteSecret(string target, string userName, string secret) {
      var secretBytes = Encoding.Unicode.GetBytes(secret);
      var credential = new CREDENTIAL();
      credential.AttributeCount = 0;
      credential.Attributes = IntPtr.Zero;
      credential.Comment = null;
      credential.TargetAlias = null;
      credential.Type = CRED_TYPE_GENERIC;
      credential.Persist = CRED_PERSIST_LOCAL_MACHINE;
      credential.CredentialBlobSize = (uint)secretBytes.Length;
      credential.TargetName = target;
      credential.UserName = userName;

      credential.CredentialBlob = Marshal.AllocCoTaskMem(secretBytes.Length);
      try {
        Marshal.Copy(secretBytes, 0, credential.CredentialBlob, secretBytes.Length);
        if (!CredWrite(ref credential, 0)) {
          throw new InvalidOperationException("CredWrite failed: " + Marshal.GetLastWin32Error());
        }
      } finally {
        if (credential.CredentialBlob != IntPtr.Zero) {
          Marshal.FreeCoTaskMem(credential.CredentialBlob);
        }
      }
    }

    public static void DeleteSecret(string target) {
      if (!CredDelete(target, CRED_TYPE_GENERIC, 0)) {
        var error = Marshal.GetLastWin32Error();
        if (error != 1168) {
          throw new InvalidOperationException("CredDelete failed: " + error);
        }
      }
    }
  }
}
'@
}

switch ($Action) {
  'get' {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    [CredManager.NativeMethods]::ReadSecret($Target)
    break
  }
  'set' {
    if ([string]::IsNullOrWhiteSpace($Secret)) {
      throw 'Secret is required when Action=set.'
    }

    [CredManager.NativeMethods]::WriteSecret($Target, $UserName, $Secret)
    break
  }
  'delete' {
    [CredManager.NativeMethods]::DeleteSecret($Target)
    break
  }
}
