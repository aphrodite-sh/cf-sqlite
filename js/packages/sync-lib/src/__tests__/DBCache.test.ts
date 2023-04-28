import { test, expect, afterAll, vi } from "vitest";
import DBCache from "../DBCache";
import TestConfig from "../TestConfig";
import fs from "fs";

test("cache evicts", () => {
  vi.useFakeTimers();
  const cache = new DBCache(TestConfig);

  const dbid = "dbid";
  const db = cache.get(dbid);
  const internalMap = cache.__testsOnly();

  expect(internalMap.size).toBe(1);
  expect(internalMap.get(dbid)).toBe(db);
  // advance but not enough to evict
  vi.advanceTimersByTime(TestConfig.cacheTtlInSeconds * 1000 + 10);
  expect(internalMap.size).toBe(1);
  expect(internalMap.get(dbid)).toBe(db);

  // advance enough to evict
  vi.advanceTimersByTime(TestConfig.cacheTtlInSeconds * 1000 + 10);
  expect(internalMap.size).toBe(0);
});

test("cache bumps to now on usage", () => {
  vi.useFakeTimers();
  const cache = new DBCache(TestConfig);

  const dbid = "dbid";
  const db = cache.get(dbid);
  const internalMap = cache.__testsOnly();

  expect(internalMap.size).toBe(1);
  expect(internalMap.get(dbid)).toBe(db);
  vi.advanceTimersByTime(TestConfig.cacheTtlInSeconds * 1000 + 10);
  expect(internalMap.size).toBe(1);
  expect(internalMap.get(dbid)).toBe(db);
  const cacheddb = cache.get(dbid);
  expect(cacheddb).toBe(db);

  vi.advanceTimersByTime(TestConfig.cacheTtlInSeconds * 1000 + 10);
  expect(internalMap.size).toBe(1);
  expect(internalMap.get(dbid)).toBe(db);

  vi.advanceTimersByTime(TestConfig.cacheTtlInSeconds * 1000 + 1000);
  expect(internalMap.size).toBe(0);
});