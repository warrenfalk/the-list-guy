import fs from "fs";

interface Db<S> {
    get<T extends keyof S>(type: T, key: string): S[T] | undefined;
    getAll<T extends keyof S>(type: T): {key: string, value: S[T]}[];
    set<T extends keyof S>(type: T, key: string, value: S[T] | undefined): void;
}

function openFileSync(path: string): Map<string, string> {
    if (!fs.existsSync("state.json"))
        return new Map<string, string>();
    
    const contents = fs.readFileSync("state.json", "utf8");
    const data = JSON.parse(contents) as [string, string][];
    return new Map(data);
}

export function openDatabase<S>(): Db<S> {
    const data = openFileSync("state.json");
    let dirty: boolean = false;

    function save() {
        setTimeout(async () => {
            if (dirty) {
                const json = JSON.stringify(Array.from(data));
                await fs.promises.writeFile("state.json~", json, "utf8");
                await fs.promises.rename("state.json~", "state.json");
                console.log("Saved");
            }
            setTimeout(save);
            dirty = false;
        }, 1000);
    }
    save();

    function dbKeyFrom<T, K extends keyof T>(key: string, type: string | number | symbol) {
        return `${JSON.stringify(type)}|${key}`;
    }

    function get<T, K extends keyof T>(type: K, key: string): T[K] | undefined {
        const dbKey = dbKeyFrom(key, type);
        const encoded = data.get(dbKey);
        if (encoded === undefined)
            return undefined;
        const decoded = JSON.parse(encoded) as T[K];
        return decoded;
    }

    function getAll<T, K extends keyof T>(type: K): {key: string, value: T[K]}[] {
        const prefix = `${JSON.stringify(type)}|`;
        const rval: {key: string, value: T[K]}[] = [];
        for (const [key, encoded] of data) {
            if (key.startsWith(prefix)) {
                const decoded = JSON.parse(encoded) as T[K]
                rval.push({key, value: decoded})
            }
        }
        return rval;
    }

    function set<T, K extends keyof T>(type: K, key: string, value: T[K] | undefined): void {
        const dbKey = dbKeyFrom(key, type);
        if (value === undefined) {
            data.delete(dbKey);
            dirty = true;
        }
        else {
            const encoded = JSON.stringify(value);
            data.set(dbKey, encoded);
            dirty = true;
        }
    }

    const dbGet = <T extends keyof S>(type: T, key: string) => get<S, T>(type, key);
    const dbGetAll = <T extends keyof S>(type: T) => getAll<S, T>(type);
    const dbSet = <T extends keyof S>(type: T, key: string, value: S[T]) => set<S, T>(type, key, value);
    
    return {
        get: dbGet,
        getAll: dbGetAll,
        set: dbSet,
    }
}

