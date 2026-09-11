import { describe, it, expect } from "vitest";
import {
  calculateMonodealScore,
  calculateLowdeckScore,
  interpolateAvgFinishBonus,
} from "./leaderboard.js";

describe("leaderboard scoring", () => {
  it("returns 0 when no games have been played", () => {
    expect(
      calculateMonodealScore({
        wins: 0,
        gamesPlayed: 0,
        avgFinish: 0,
        completedSets: 0,
      }),
    ).toBe(0);
    expect(calculateLowdeckScore({ wins: 0, gamesPlayed: 0, avgFinish: 0 })).toBe(0);
  });

  it("calculates exact table values for avg finish bonus", () => {
    expect(interpolateAvgFinishBonus(1.0)).toBe(100);
    expect(interpolateAvgFinishBonus(2.0)).toBe(50);
    expect(interpolateAvgFinishBonus(4.0)).toBe(-25);
  });

  it("interpolates between table points", () => {
    expect(interpolateAvgFinishBonus(1.8)).toBe(60);
    expect(interpolateAvgFinishBonus(2.25)).toBe(37.5);
  });

  it("awards more points for winning than losing", () => {
    const winner = calculateMonodealScore({
      wins: 10,
      gamesPlayed: 10,
      avgFinish: 1.0,
      completedSets: 30,
    });
    const loser = calculateMonodealScore({
      wins: 0,
      gamesPlayed: 10,
      avgFinish: 2.5,
      completedSets: 10,
    });
    expect(winner).toBeGreaterThan(loser);
  });

  it("rounds the final score to an integer", () => {
    const score = calculateMonodealScore({
      wins: 1,
      gamesPlayed: 5,
      avgFinish: 2.0,
      completedSets: 4,
    });
    expect(Number.isInteger(score)).toBe(true);
  });

  it("handles a large number of games", () => {
    const score = calculateMonodealScore({
      wins: 100,
      gamesPlayed: 200,
      avgFinish: 1.5,
      completedSets: 500,
    });
    expect(score).toBeGreaterThan(0);
  });
});
