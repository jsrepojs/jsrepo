import { describe, it, expect } from "vitest";
import { BASE_URL as JSREPO_BASE_URL } from "../src/utils/registry-providers/jsrepo";

describe('JSREPO_BASE_URL', () => {
    it('is the correct url', () => {
        expect(JSREPO_BASE_URL).toBe('https://jsrepo.com')
    })
})