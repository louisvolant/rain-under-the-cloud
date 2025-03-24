// src/utils/PasswordUtils.ts

const argon2 = require('argon2');

const hashPasswordArgon2 = async (password) => {
    return await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1
    });
};


const verifyPassword = async (password, hash) => {
  return await argon2.verify(hash, password);
};



module.exports = { hashPasswordArgon2, verifyPassword };