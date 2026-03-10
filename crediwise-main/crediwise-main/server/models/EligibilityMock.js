const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/eligibility.json');

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
        return this; // No-op for now or simple sort
    }

    limit(n) {
        this.data = this.data.slice(0, n);
        return this;
    }

    then(resolve, reject) {
        resolve(this.data);
    }
}

class EligibilityMock {
    static _read() {
        try {
            if (!fs.existsSync(DATA_FILE)) return [];
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        } catch (e) {
            return [];
        }
    }

    static find() {
        return new MockQuery(this._read());
    }

    static async countDocuments() {
        const data = this._read();
        return data.length;
    }
}

module.exports = EligibilityMock;
