const admin = require("../config/firebase-admin");

class EligibilityFirestore {
    static get collection() {
        return admin.firestore().collection("applications");
    }

    // Used by Admin Controller to list recent applications
    static find() {
        return {
            sort: ({ createdAt }) => {
                return {
                    limit: async (limitVal) => {
                        try {
                            // Use Firestore ordering if possible, or manual sorting
                            const snapshot = await this.collection.orderBy('createdAt', 'desc').limit(limitVal).get();
                            const apps = [];
                            snapshot.forEach(doc => apps.push(doc.data()));
                            return apps;
                        } catch (e) {
                            console.error("Firestore App List Error:", e);
                            return [];
                        }
                    }
                }
            }
        }
    }

    static async create(data) {
        // Just push to collection with auto-ID
        await this.collection.add(data);
    }

    static async countDocuments() {
        const snapshot = await this.collection.get();
        return snapshot.size;
    }
}

module.exports = EligibilityFirestore;
