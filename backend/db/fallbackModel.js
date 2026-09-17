const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('./connection');

class FallbackModel {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.filePath = path.join(DATA_DIR, `${collectionName}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), 'utf8');
    }
  }

  readData() {
    try {
      if (!fs.existsSync(this.filePath)) {
        return [];
      }
      const content = fs.readFileSync(this.filePath, 'utf8');
      const items = JSON.parse(content);
      return items.map(item => ({
        ...item,
        createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
      }));
    } catch (e) {
      return [];
    }
  }

  writeData(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  async find(filter = {}) {
    let items = this.readData();
    return items.filter(item => this.matchesFilter(item, filter));
  }

  async findOne(filter = {}) {
    const items = this.readData();
    const item = items.find(item => this.matchesFilter(item, filter));
    return item || null;
  }

  async findById(id) {
    return this.findOne({ _id: id });
  }

  async create(doc) {
    const items = this.readData();
    const now = new Date();
    
    if (Array.isArray(doc)) {
      const createdDocs = doc.map(d => ({
        _id: d._id || Math.random().toString(36).substring(2, 9),
        ...d,
        createdAt: now,
        updatedAt: now,
      }));
      items.push(...createdDocs);
      this.writeData(items);
      return createdDocs;
    } else {
      const createdDoc = {
        _id: doc._id || Math.random().toString(36).substring(2, 9),
        ...doc,
        createdAt: now,
        updatedAt: now,
      };
      items.push(createdDoc);
      this.writeData(items);
      return createdDoc;
    }
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const items = this.readData();
    const index = items.findIndex(item => String(item._id) === String(id));
    if (index === -1) return null;
    
    let updatedItem = { ...items[index] };
    const $set = update.$set || update;
    
    for (const key of Object.keys($set)) {
      updatedItem[key] = $set[key];
    }
    updatedItem.updatedAt = new Date();
    
    items[index] = updatedItem;
    this.writeData(items);
    return updatedItem;
  }

  async updateOne(filter, update, options = {}) {
    const items = this.readData();
    const index = items.findIndex(item => this.matchesFilter(item, filter));
    if (index === -1) return { modifiedCount: 0 };

    let updatedItem = { ...items[index] };
    const $set = update.$set || update;
    for (const key of Object.keys($set)) {
      updatedItem[key] = $set[key];
    }
    updatedItem.updatedAt = new Date();
    items[index] = updatedItem;
    this.writeData(items);
    return { modifiedCount: 1 };
  }

  async deleteOne(filter) {
    const items = this.readData();
    const index = items.findIndex(item => this.matchesFilter(item, filter));
    if (index === -1) return { deletedCount: 0 };
    items.splice(index, 1);
    this.writeData(items);
    return { deletedCount: 1 };
  }

  async deleteMany(filter = {}) {
    const items = this.readData();
    const remaining = items.filter(item => !this.matchesFilter(item, filter));
    const deletedCount = items.length - remaining.length;
    this.writeData(remaining);
    return { deletedCount };
  }

  async countDocuments(filter = {}) {
    const items = this.readData();
    return items.filter(item => this.matchesFilter(item, filter)).length;
  }

  matchesFilter(item, filter) {
    if (!filter || Object.keys(filter).length === 0) return true;
    for (const key of Object.keys(filter)) {
      let filterVal = filter[key];
      let itemVal = item[key];

      if (key === '$or' && Array.isArray(filterVal)) {
        return filterVal.some(subFilter => this.matchesFilter(item, subFilter));
      }

      if (filterVal && typeof filterVal === 'object' && !Array.isArray(filterVal)) {
        if ('$in' in filterVal && Array.isArray(filterVal.$in)) {
          if (!filterVal.$in.includes(itemVal)) return false;
          continue;
        }
        if ('$nin' in filterVal && Array.isArray(filterVal.$nin)) {
          if (filterVal.$nin.includes(itemVal)) return false;
          continue;
        }
        if ('$regex' in filterVal) {
          const regex = new RegExp(filterVal.$regex, filterVal.$options || 'i');
          if (!regex.test(itemVal || '')) return false;
          continue;
        }
        if ('$gt' in filterVal) {
          if (!(itemVal > filterVal.$gt)) return false;
          continue;
        }
        if ('$gte' in filterVal) {
          if (!(itemVal >= filterVal.$gte)) return false;
          continue;
        }
        if ('$lt' in filterVal) {
          if (!(itemVal < filterVal.$lt)) return false;
          continue;
        }
        if ('$lte' in filterVal) {
          if (!(itemVal <= filterVal.$lte)) return false;
          continue;
        }
      }

      if (itemVal !== filterVal) {
        if (itemVal instanceof Date && filterVal instanceof Date) {
          if (itemVal.getTime() !== filterVal.getTime()) return false;
          continue;
        }
        if (String(itemVal) === String(filterVal)) {
          continue;
        }
        return false;
      }
    }
    return true;
  }
}

module.exports = FallbackModel;
