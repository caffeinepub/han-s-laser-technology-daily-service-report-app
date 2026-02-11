/**
 * Best-effort utility to clear Internet Identity / AuthClient persisted state from IndexedDB.
 * This ensures that after logout, the browser does not automatically re-authenticate on reload.
 * 
 * Safe and non-blocking: swallows all errors and returns cleanly if unsupported.
 */
export async function clearAuthClientIndexedDB(): Promise<void> {
  try {
    // Check if IndexedDB is supported
    if (!window.indexedDB) {
      console.warn('IndexedDB not supported, skipping auth IndexedDB cleanup');
      return;
    }

    // Known AuthClient/Internet Identity database names
    const authDbNames = [
      'auth-client-db',
      'ic-keyval',
      'ic-identity',
      'auth-client',
    ];

    // Attempt to delete known auth-related databases with timeout
    for (const dbName of authDbNames) {
      try {
        const deleteRequest = window.indexedDB.deleteDatabase(dbName);
        
        // Wrap in promise with timeout to handle async operation
        await Promise.race([
          new Promise<void>((resolve, reject) => {
            deleteRequest.onsuccess = () => {
              console.log(`Deleted IndexedDB: ${dbName}`);
              resolve();
            };
            deleteRequest.onerror = () => {
              console.warn(`Failed to delete IndexedDB: ${dbName}`, deleteRequest.error);
              resolve(); // Don't reject, just log and continue
            };
            deleteRequest.onblocked = () => {
              console.warn(`IndexedDB deletion blocked: ${dbName}`);
              resolve(); // Don't reject, just log and continue
            };
          }),
          // Timeout after 2 seconds
          new Promise<void>((resolve) => setTimeout(() => {
            console.warn(`IndexedDB deletion timeout: ${dbName}`);
            resolve();
          }, 2000))
        ]);
      } catch (error) {
        console.warn(`Error deleting IndexedDB ${dbName}:`, error);
        // Continue with other databases
      }
    }

    // Additional best-effort: try to enumerate and delete any databases with 'auth' or 'identity' in the name
    try {
      if ('databases' in window.indexedDB) {
        const databases = await Promise.race([
          window.indexedDB.databases(),
          new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 2000))
        ]);
        
        for (const db of databases) {
          if (db.name && (
            db.name.toLowerCase().includes('auth') ||
            db.name.toLowerCase().includes('identity') ||
            db.name.toLowerCase().includes('ic-')
          )) {
            try {
              await Promise.race([
                new Promise<void>((resolve) => {
                  const deleteRequest = window.indexedDB.deleteDatabase(db.name!);
                  deleteRequest.onsuccess = () => {
                    console.log(`Deleted discovered auth IndexedDB: ${db.name}`);
                    resolve();
                  };
                  deleteRequest.onerror = () => {
                    console.warn(`Failed to delete discovered IndexedDB: ${db.name}`);
                    resolve();
                  };
                  deleteRequest.onblocked = () => {
                    console.warn(`Deletion blocked for discovered IndexedDB: ${db.name}`);
                    resolve();
                  };
                }),
                new Promise<void>((resolve) => setTimeout(resolve, 2000))
              ]);
            } catch (error) {
              console.warn(`Error deleting discovered IndexedDB ${db.name}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Could not enumerate IndexedDB databases:', error);
    }

    console.log('Auth IndexedDB cleanup completed');
  } catch (error) {
    console.error('Error during auth IndexedDB cleanup:', error);
    // Never throw - this is best-effort cleanup
  }
}
