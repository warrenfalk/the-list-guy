import { openDatabase } from "./database"

type Schema = {
    id: string,
    number: number,
    list: List,
}

export type List = {
    items: string[],
    name: string,
    next: number,
}

const db = openDatabase<Schema>();

export function deleteList(name: string) {
    const key = name.toLowerCase();
    db.set("list", key, undefined);
}

export function saveList(list: List) {
    const key = list.name.toLowerCase();
    db.set("list", key, list);
}

export function createList(name: string): List {
    const newList: List = {
        items: [],
        name: name,
        next: 0,
    }
    db.set("list", name.toLowerCase(), newList);
    return newList;
}

export function setCurrentListName(name: string | undefined) {
    db.set("id", "currentList", name);
}

// functions that don't change state

export function getCurrentListName() {
    return db.get("id", "currentList");
}

export function getList(name: string) {
    return db.get("list", name.toLowerCase());
}

export function getListCount(): number {
    return db.getAll("list").length;
}

/*

export function addListItem(list: PeopleList, name: string): boolean {
    if (list.items.some(i => i === name))
        return false;
    peopleLists.set(list.number, {
        ...list,
        items: [...list.items, name]
    })
    return true;
}

export function randomizeItems(list: PeopleList) {
    const randomized = {
        ...list,
        items: randomize(list.items),
        next: 0,
    }
    peopleLists.set(randomized.number, randomized);
    return randomized;
}

function takeIndex(list: PeopleList, index: number): string {
    const takeIndex = index;
    const take = list.items[takeIndex];
    const next = (takeIndex + 1) === list.items.length ? 0 : takeIndex + 1;
    const advanced = {
        ...list,
        next: next,
    }
    peopleLists.set(advanced.number, advanced);
    return take;
}

export function takeNext(list: PeopleList): string {
    return takeIndex(list, list.next);
}

export function removeItem(list: PeopleList, index: number) {
    const removed = list.items.slice();
    removed.splice(index);
    const next = list.next;
    const modified = {
        ...list,
        next: next < index ? next : next - 1,
        items: removed,
    }
    peopleLists.set(modified.number, modified);
    return modified;
}

export function takeFirst(list: PeopleList): string {
    return takeIndex(list, 0);
}

export function clearItems(list: PeopleList) {
    const cleared = {
        ...list,
        items: [],
        next: 0,            
    }
    peopleLists.set(cleared.number, cleared);
}

*/