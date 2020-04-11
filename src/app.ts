import { IntentRequest, ResponseEnvelope, LaunchRequest } from 'ask-sdk-model';
import * as Db from "./list-database";
import { List } from './list-database';

function say(text: string, keepOpen: boolean = false): ResponseEnvelope {
    return {
        version: "1.0",
        response: {
            shouldEndSession: !keepOpen,
            outputSpeech: {
                type: "PlainText",
                text: text,
            }
        }
    }    
}

/* Randomize array in-place using Durstenfeld shuffle algorithm */
function shuffle<T>(input: T[]): T[] {
    const array = input.slice();
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

export async function openApp(launchRequest: LaunchRequest): Promise<ResponseEnvelope> {
    console.log(launchRequest);
    const name = Db.getCurrentListName();
    if (!name) {
        const count = Db.getListCount();
        return say(`OK, You have ${count} list${count !== 1 ? "s" : ""}`, true);
    }
    else {
        return say(`OK, the current list is "${name}"`, true);
    }
}

function getCurrentList(): List | undefined {
    const name = Db.getCurrentListName();
    if (name === undefined)
        return undefined;
    return Db.getList(name);
}

export async function processIntentRequest(intentRequest: IntentRequest): Promise<ResponseEnvelope> {
    const { intent } = intentRequest;
    console.log(`Intent:`, intent);
    switch (intent.name) {
        case "NewListIntent": {
            const name: string | undefined = intent.slots?.name.value;
            if (!name) {
                return say(`Didn't catch that`, true);
            }
            const list = Db.createList(name);
            Db.setCurrentListName(name);
            return say(`OK. I created a list named "${list.name}"`, true);
        }
        case "Randomize": {
            const list = getCurrentList();
            if (!list) {
                return say(`You haven't selected a list, yet`, true);
            }
            list.items = shuffle(list.items);
            list.next = 1;
            const first = list.items[0];
            Db.saveList(list);
            const response = say(`OK, I randomized list "${list.name}" with ${list.items.length} items. ${first} is first`, true);
            return response;
        }
        case "UseList": {
            const name = intent.slots!.name.value;
            if (!name) {
                return say(`Didn't catch that`, true);
            }
            const list = Db.getList(name);
            if (!list) {
                return say(`Hmm, I don't see a list named "${name}"`)
            }
            Db.setCurrentListName(name);
            return say(`OK, using list, "${name}"`, true);
        }
        case "DeleteList": {
            const name = intent.slots!.name?.value || Db.getCurrentListName();
            if (!name) {
                return say(`You haven't selected a list, yet`, true);
            }
            const list = Db.getList(name);
            if (!list) {
                return say(`Hmm... I can't find that list`, true);
            }
            Db.deleteList(name);
            const current = Db.getCurrentListName();
            if (current === name) {
                Db.setCurrentListName(undefined);
            }
            return say(`OK, I deleted list "${list.name}" with ${list.items.length} items`, true);
        }
        case "ClearList": {
            const list = getCurrentList();
            if (!list) {
                return say(`You haven't selected a list, yet`, true);
            }
            list.items = [];
            Db.saveList(list);
            return say(`OK, cleared "${list.name}"`, true);
        }
        case "WhatIsFirst": {
            const list = getCurrentList();
            if (!list) {
                return say(`You haven't selected a list, yet`, true);
            }
            list.next = 1 % list.items.length;
            const first = list.items[0];
            Db.saveList(list);
            return say(`${first} is first`, true);
        }
        case "WhatIsNext": {
            const list = getCurrentList();
            if (!list) {
                return say(`You haven't selected a list, yet`, true);
            }
            const next = list.items[list.next];
            list.next = (list.next + 1) % list.items.length;
            Db.saveList(list);
            return say(`${next} is next`, true)
        }
        case "WhatIsTheOrder": {
            const list = getCurrentList();
            if (!list) {
                return say(`You haven't selected a list, yet`, true);
            }
            if (list.items.length === 0) {
                return say (`The list is empty`, true);
            }
            else if (list.items.length === 1) {
                return say (`There is only one, "${list.items[0]}"`, true);
            }
            else {
                const lastIndex = list.items.length - 1;
                const listFirst = list.items.slice(0, lastIndex).join(", ")
                const listLast = list.items[lastIndex];
                const listSay = `The order is: ${listFirst}, and ${listLast}`;
                return say(listSay, true);
            }
        }
        case "AddItemIntent": {
            const list = getCurrentList();
            if (!list) {
                return say(`You haven't selected a list, yet`, true);
            }
            const item: string | undefined = intent.slots?.item.value;
            if (!item) {
                return say(`Didn't catch that`, true);
            }
            list.items.push(item);
            Db.saveList(list);
            return say(`"${item}" added`, true);
        }
        case "RemoveItem": {
            const list = getCurrentList();
            if (!list) {
                return say(`You haven't selected a list, yet`, true);
            }
            const item: string | undefined = intent.slots?.item.value;
            if (!item) {
                return say(`Didn't catch that`, true);
            }
            const index = list.items.findIndex(f => f.toLowerCase() === item.toLowerCase())
            if (index === -1) {
                return say(`I couldn't find "${item}" in "${list.name}"`, true);
            }
            list.items.splice(index, 1);
            Db.saveList(list);
            return say (`Alright, "${item}" has been removed`, true);
        }
        case "HowManyLists": {
            const count = Db.getListCount();
            if (count === 1) {
                return say(`There is 1 list`, true);
            }
            else {
                return say(`There are ${count} lists`, true);
            }
        }
        case "HowManyItems": {
            const list = getCurrentList();
            if (!list) {
                return say(`You haven't selected a list, yet`, true);
            }
            return say(`There are ${list.items.length} items in "${list.name}"`, true);
        }
        default:
            console.warn(`Unhandled intent ${intent.name}`);
    }
    
    return say("Hmm... I don't know what to do");
}

