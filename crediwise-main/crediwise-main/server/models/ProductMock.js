const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/products.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(DATA_FILE))) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

// Initialize file if empty
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

class MockQuery {
    constructor(data) {
        this.data = data;
    }

    sort(criteria) {
        const keys = Object.keys(criteria);
        if (keys.length === 0) return this;

        const key = keys[0];
        const dir = criteria[key];

        this.data.sort((a, b) => {
            if (a[key] < b[key]) return -1 * dir;
            if (a[key] > b[key]) return 1 * dir;
            return 0;
        });
        return this;
    }

    limit(n) {
        this.data = this.data.slice(0, n);
        return this;
    }

    then(resolve, reject) {
        resolve(this.data);
    }
}

class ProductMock {
    static _read() {
        try {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        } catch (e) {
            return [];
        }
    }

    static _write(data) {
        try {
            fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        } catch (e) {
            console.warn("Write failed (likely Read-Only FS on Vercel). In-memory update only.");
            // In a real Vercel app, you'd use MongoDB/Postgres. 
            // For this mock, we accept data won't persist across requests on serverless.
        }
    }

    static find() {
        return new MockQuery(this._read());
    }

    static async findOneAndUpdate(query, updates, options) {
        const products = this._read();
        const index = products.findIndex(p => p.id === parseInt(query.id));

        if (index === -1) return null;

        // Apply updates
        products[index] = { ...products[index], ...updates };
        this._write(products);
        return products[index];
    }

    static async create(data) {
        const products = this._read();
        products.push(data);
        this._write(products);
        return data;
    }

    static async findOneAndDelete(query) {
        let products = this._read();
        const initialLength = products.length;
        products = products.filter(p => p.id !== parseInt(query.id));

        if (products.length === initialLength) return null;

        this._write(products);
        return { success: true };
    }

    // Helper for findOne used in createProduct ID generation
    static findOne() {
        const products = this._read();
        return {
            sort: ({ id }) => {
                if (id === -1) {
                    // Sort descending by id and take first
                    const sorted = [...products].sort((a, b) => b.id - a.id);
                    return sorted[0];
                }
                return products[0];
            }
        };
    }

    static async countDocuments() {
        return this._read().length;
    }

    static async insertMany(items) {
        const products = this._read();
        const newProducts = [...products, ...items];
        this._write(newProducts);
        return newProducts;
    }
}

module.exports = ProductMock;
