import userscript_handle from "lib/storage/userscript";

// Holt die Userscripte aus dem Speicher (simple-storage)
export default async function userscript_storage () {
    var all_userscripts : Array<any> = [];
    var storage;
    var storage_keys: any;

    let self = {
        // simple
        refresh: async function () {
            // hole alle, bis auf die "settings"
            storage = await browser.storage.local.get(null);

            storage_keys = Object.keys(storage);

            // settings entfernen, da die userscripte flach im browser.storage.local liegen
            delete storage_keys.settings;

            all_userscripts = [];

            for (var storage_key of storage_keys) {
                // Beispiel für einen passenden Key userscript_1241841403424
                if (/userscript_(\d+)/.test(storage_key)) {
                    // OK dies ist ein Userscript Eintrag
                    all_userscripts.push(storage[storage_key]);
                }
            }

            // eigene Referenz zurückgeben
            return self;
        }
        , getAll: function () {
            return all_userscripts;
        }
        , deleteAll: async function () {
            for (var storage_key of storage_keys) {
                await browser.storage.local.remove(storage_key);
            }
            return true;
        }
        , save: async function (id: number, userscript_data: any) {
            let storage_id = "userscript_" + id;

            let entry = <any>{};
            // speichert alle Daten vom Userscript
            entry[storage_id] = userscript_data;

            await browser.storage.local.set(entry);
            return true;
        }
        , deleteUserscript: async function (id: number) {
            let storage_id = "userscript_" + id;
            // löscht ein Userscript aus dem Storage
            await browser.storage.local.remove(storage_id);
            return true;
        }
        , getById: function (id: any) {
            // ACHTUNG ID wird als Integer verarbeitet
            id = Number(id);

            // holt alle Userscripte, und mittels find() wird jedes Element übergeben, falls die ele.id mit der ID übereinstimmt gib diese zurück
            var found_userscript = self.getAll().find(function (ele) {
                var element_id = parseInt(ele.id);
                if (element_id === id) {
                    return true;
                } else {
                    return false;
                }
            });

            // wenn ein Userscript gefunden wurde, initialisiere es
            if (typeof found_userscript === "object") {
                return userscript_handle().initWithData(found_userscript);
            } else {
                return false;
            }
        }

        , createNew: function () {
            let new_id, userscript_found;
            // probiere es 3 Mal eine neue ID zu erzeugen
            for (var i = 0; i < 3; i++) {
                new_id = new Date().getTime();
                // prüfe ob die ID, nicht doch schon existiert
                userscript_found = self.getById(new_id);
                if (userscript_found === false) {
                    // kein Userscript mit dieser ID gefunden, gibt ein neues Handle zurück
                    return userscript_handle().initWithData(
                        // übergib ein neues Userscript
                        userscript_handle().getSkeleton(new_id)
                    );
                }
            }
            // das sollte eigentlich nicht passieren!
            return false;
        }
    };

    await self.refresh();

    return self;

}