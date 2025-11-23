import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import BuildingInfo from './components/BuildingInfo';
import { BUILDING_DATA, BUILDING_NAMES } from './constants';
import type { BuildingName } from './types';
import { SparkleIcon } from './components/Icons';
import { fetchCurrentBuilding } from './services/buildingFeed';
import './index.css';
type SensorStatus = 'idle' | 'syncing' | 'live' | 'waiting' | 'error';
const POLL_INTERVAL_MS = 3000;

const App: React.FC = () => {
  const [activeBuilding, setActiveBuilding] = useState<BuildingName>(BUILDING_NAMES[0]);
  const [sensorStatus, setSensorStatus] = useState<SensorStatus>('idle');
  const [sensorError, setSensorError] = useState<string | null>(null);
  const [lastTouchedAt, setLastTouchedAt] = useState<string | null>(null);

  const selectedBuildingData = useMemo(() => {
    return BUILDING_DATA.find(building => building.name === activeBuilding);
  }, [activeBuilding]);

  useEffect(() => {
    let isMounted = true;
    let controller: AbortController | null = null;

    const poll = async () => {
      setSensorStatus(prev => (prev === 'live' ? prev : 'syncing'));

      controller?.abort();
      controller = new AbortController();

      try {
        const result = await fetchCurrentBuilding(controller.signal);
        if (!isMounted) return;

        setSensorError(null);

        if (result.buildingName) {
          setActiveBuilding(result.buildingName);
          setSensorStatus('live');
          setLastTouchedAt(result.touchedAt || new Date().toISOString());
        } else {
          setSensorStatus('waiting');
        }
      } catch (error) {
        if (!isMounted) return;
        if (
          error instanceof DOMException &&
          error.name === 'AbortError'
        ) {
          return;
        }
        setSensorStatus('error');
        setSensorError((error as Error)?.message ?? 'Unknown error');
      }
    };

    poll();
    const intervalId = window.setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      controller?.abort();
      window.clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-10 relative">
        <Header />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4">
          <div>
            <p className="text-sm text-gray-500">Arduino Touch Sensor</p>
            <p className="text-base font-semibold text-gray-700 tracking-wide">
              {sensorStatus === 'live' && `터치 감지: ${activeBuilding}`}
              {sensorStatus === 'waiting' && '센서에서 값 대기 중'}
              {sensorStatus === 'syncing' && '센서 연결 중...'}
              {sensorStatus === 'idle' && '센서를 초기화하는 중'}
              {sensorStatus === 'error' && '센서 연결 오류'}
            </p>
          </div>
          <div className="text-sm text-gray-500 font-medium">
            {sensorError ? (
              <span className="text-red-500">에러: {sensorError}</span>
            ) : lastTouchedAt ? (
              <span>최근 업데이트: {new Date(lastTouchedAt).toLocaleTimeString()}</span>
            ) : (
              <span>최근 업데이트 정보 없음</span>
            )}
          </div>
        </div>
        <Navigation
          activeBuilding={activeBuilding}
          setActiveBuilding={setActiveBuilding}
        />
        <main className="mt-10">
          {selectedBuildingData ? (
            <BuildingInfo building={selectedBuildingData} />
          ) : (
            <div className="text-center text-gray-500">
              <p>Please select a building to see its details.</p>
            </div>
          )}
        </main>
      </div>
       <footer className="fixed bottom-0 right-0 p-8 z-10 pointer-events-none">
         <SparkleIcon className="w-16 h-16 text-gray-800" />
      </footer>
    </div>
  );
};

export default App;
