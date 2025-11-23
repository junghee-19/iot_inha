import { BUILDING_NAMES } from '../constants';
import type { BuildingName } from '../types';
import { BUILDING_FEED_ENDPOINT } from '../config';

export interface BuildingFeedResponse {
  buildingId?: number;
  buildingName?: string;
  touchedAt?: string;
  sensorCode?: number;
  [key: string]: unknown;
}

export interface BuildingFeedResult {
  buildingName: BuildingName | null;
  touchedAt?: string;
  sensorCode?: number;
  raw: BuildingFeedResponse;
}

const isBuildingName = (value: unknown): value is BuildingName =>
  typeof value === 'string' &&
  BUILDING_NAMES.includes(value as BuildingName);

const parseNumeric = (value?: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const match = trimmed.match(/-?\d+/);
    if (!match) return null;
    const parsed = Number(match[0]);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const getBuildingById = (id?: unknown): BuildingName | null => {
  const numeric = parseNumeric(id);
  if (numeric == null) return null;
  const index = numeric <= 0 ? 0 : numeric;
  return BUILDING_NAMES[index] ?? null;
};

const getBuildingFromSensorCode = (code?: unknown): BuildingName | null => {
  const numeric = parseNumeric(code);
  if (numeric == null) return null;
  if (numeric <= 0) return BUILDING_NAMES[0];
  const normalizedIndex = numeric - 1;
  return BUILDING_NAMES[normalizedIndex] ?? null;
};

export const fetchCurrentBuilding = async (
  signal?: AbortSignal,
): Promise<BuildingFeedResult> => {
  const response = await fetch(BUILDING_FEED_ENDPOINT, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }, 
    signal,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to fetch building feed (${response.status}): ${text}`,
    );
  }

  const data = (await response.json()) as BuildingFeedResponse;

  const buildingName =
    (isBuildingName(data.buildingName) && data.buildingName) ||
    getBuildingById(data.buildingId) ||
    getBuildingFromSensorCode(data.sensorCode) ||
    null;

  return {
    buildingName,
    touchedAt: data.touchedAt,
    sensorCode: data.sensorCode,
    raw: data,
  };
};
