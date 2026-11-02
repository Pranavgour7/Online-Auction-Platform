const { describe, it } = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { auth, admin } = require('../middleware/auth');

describe('Auth & Security Unit Tests', () => {
  const secretKey = 'test_jwt_secret_key_123';
  process.env.JWT_SECRET = secretKey;

  it('correctly hashes and compares passwords using bcrypt', async () => {
    const rawPassword = 'SecurePassword2026!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    assert.notStrictEqual(hash, rawPassword);
    const isMatch = await bcrypt.compare(rawPassword, hash);
    assert.strictEqual(isMatch, true);

    const isWrongMatch = await bcrypt.compare('WrongPassword', hash);
    assert.strictEqual(isWrongMatch, false);
  });

  it('signs and verifies JWT tokens with user payload', () => {
    const payload = { id: '60d0fe4f5311236168a109ca', role: 'user' };
    const token = jwt.sign(payload, secretKey, { expiresIn: '1h' });

    assert.ok(typeof token === 'string' && token.length > 20);

    const decoded = jwt.verify(token, secretKey);
    assert.strictEqual(decoded.id, payload.id);
    assert.strictEqual(decoded.role, payload.role);
  });

  it('rejects expired or invalid tokens', () => {
    const invalidToken = 'invalid.jwt.token';
    assert.throws(() => {
      jwt.verify(invalidToken, secretKey);
    }, (err) => err.name === 'JsonWebTokenError' || /invalid/i.test(err.message));
  });

  it('admin middleware passes when user role is admin', () => {
    let nextCalled = false;
    const req = { user: { role: 'admin', username: 'admin_user' } };
    const res = {
      status: (code) => ({
        json: (data) => data
      })
    };
    const next = () => { nextCalled = true; };

    admin(req, res, next);
    assert.strictEqual(nextCalled, true);
  });

  it('admin middleware denies access with 403 when user is not admin', () => {
    let statusCode = null;
    let responseData = null;
    const req = { user: { role: 'user', username: 'regular_user' } };
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => {
            responseData = data;
            return data;
          }
        };
      }
    };
    const next = () => {};

    admin(req, res, next);
    assert.strictEqual(statusCode, 403);
    assert.match(responseData.message, /Forbidden/i);
  });
});

