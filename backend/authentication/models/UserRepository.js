class UserRepository {
  constructor() {
    this.users = new Map(); // email -> User object
    this.usersByUsername = new Map(); // username -> User object
  }

  async create(user) {
    if (this.users.has(user.email)) {
      throw new Error('Email already exists');
    }
    
    if (this.usersByUsername.has(user.username)) {
      throw new Error('Username already exists');
    }

    this.users.set(user.email, user);
    this.usersByUsername.set(user.username, user);
    return user;
  }

  async findByEmail(email) {
    return this.users.get(email) || null;
  }

  async findByUsername(username) {
    return this.usersByUsername.get(username) || null;
  }

  async findById(id) {
    for (let user of this.users.values()) {
      if (user.id === id) {
        return user;
      }
    }
    return null;
  }

  async update(id, updates) {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Email değişirse map'i güncelle
    if (updates.email && updates.email !== user.email) {
      this.users.delete(user.email);
      this.users.set(updates.email, user);
    }

    // Username değişirse map'i güncelle
    if (updates.username && updates.username !== user.username) {
      this.usersByUsername.delete(user.username);
      this.usersByUsername.set(updates.username, user);
    }

    Object.assign(user, updates);
    user.updatedAt = new Date().toISOString();
    return user;
  }

  async delete(id) {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    this.users.delete(user.email);
    this.usersByUsername.delete(user.username);
    return true;
  }

  async count() {
    return this.users.size;
  }

  async list(limit = 10, offset = 0) {
    const userArray = Array.from(this.users.values());
    return userArray.slice(offset, offset + limit);
  }
}

// Singleton instance
const userRepository = new UserRepository();
export default userRepository;
