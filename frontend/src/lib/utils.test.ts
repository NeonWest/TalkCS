import { describe, it, expect } from 'vitest';
import { isTokenExpired } from './utils';

function makeJwt(exp: number) {
    const header = btoa(JSON.stringify({ alg: 'HS256' })).replace(/=/g, '');
    const payload = btoa(JSON.stringify({ sub: 'u', exp })).replace(/=/g, '');
    return `${header}.${payload}.sig`;
}

describe('isTokenExpired', () => {
    it('returns true for expired token', () => {
        const past = Math.floor(Date.now() / 1000) - 60;
        expect(isTokenExpired(makeJwt(past))).toBe(true);
    });

    it('returns false for valid future token', () => {
        const future = Math.floor(Date.now() / 1000) + 3600;
        expect(isTokenExpired(makeJwt(future))).toBe(false);
    });

    it('returns true for malformed token', () => {
        expect(isTokenExpired('not-a-jwt')).toBe(true);
    });
});
