const admin = require("../config/firebase-admin");

class ProductFirestore {
    static get collection() {
        return admin.firestore().collection("products");
    }

    static async find() {
        try {
            const snapshot = await this.collection.get();
            const products = [];
            snapshot.forEach(doc => products.push(doc.data()));

            // Return "Sortable" object to match controller syntax
            return {
                sort: (criteria) => {
                    const keys = Object.keys(criteria);
                    if (keys.length > 0) {
                        const key = keys[0];
                        const dir = criteria[key];
                        products.sort((a, b) => (a[key] - b[key]) * dir);
                    }
                    return products;
                }
            };
        } catch (e) {
            console.error("Firestore Find Error:", e);
            return { sort: () => [] };
        }
    }

    static async findOneAndUpdate(query, updates, options) {
        try {
            // We use the integer ID as a string for document ID to keep it simple
            const docId = query.id.toString();
            const docRef = this.collection.doc(docId);

            // Merge update
            await docRef.set(updates, { merge: true });

            // Return updated data
            const doc = await docRef.get();
            return doc.data();
        } catch (e) {
            console.error("Firestore Update Error:", e);
            return null;
        }
    }

    static async create(data) {
        try {
            const docId = data.id.toString();
            await this.collection.doc(docId).set(data);
            return data;
        } catch (e) {
            console.error("Firestore Create Error:", e);
            throw e;
        }
    }

    static async findOneAndDelete(query) {
        try {
            const docId = query.id.toString();
            await this.collection.doc(docId).delete();
            return { success: true };
        } catch (e) {
            console.error("Firestore Delete Error:", e);
            return null;
        }
    }

    static findOne() {
        return {
            sort: async ({ id }) => {
                // To generate new ID: get all and find max
                // Not efficient for millions, but fine for 50 products
                const snapshot = await this.collection.get();
                let maxId = 0;
                let maxProduct = null;

                snapshot.forEach(doc => {
                    const d = doc.data();
                    if (d.id > maxId) {
                        maxId = d.id;
                        maxProduct = d;
                    }
                });
                return maxProduct;
            }
        }
    }

    // Seeding Helper
    static async countDocuments() {
        const snapshot = await this.collection.get();
        return snapshot.size;
    }

    static async insertMany(items) {
        const batch = admin.firestore().batch();
        items.forEach(item => {
            const docRef = this.collection.doc(item.id.toString());
            batch.set(docRef, item);
        });
        await batch.commit();
        return items;
    }
}

module.exports = ProductFirestore;
