import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import BuildingInfo from './components/BuildingInfo';
import { BUILDING_DATA, BUILDING_NAMES } from './constants';
import type { BuildingName } from './types';
import { SparkleIcon } from './components/Icons';
import { fetchCurrentBuilding } from './services/buildingFeed';
import { BACKEND_URL, CRAWL_API_URL } from './config';
import './index.css';
import AiAssistant from './components/AiAssistant';

type SensorStatus = 'idle' | 'syncing' | 'live' | 'waiting' | 'error';
const POLL_INTERVAL_MS = 3000;

const App: React.FC = () => {
  const [activeBuilding, setActiveBuilding] = useState<BuildingName>(BUILDING_NAMES[0]);
  const [sensorStatus, setSensorStatus] = useState<SensorStatus>('idle');
  const [sensorError, setSensorError] = useState<string | null>(null);
  const [lastTouchedAt, setLastTouchedAt] = useState<string | null>(null);
  const [crawlStatus, setCrawlStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [crawlMessage, setCrawlMessage] = useState<string | null>(null);

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
          setActiveBuilding(result.buildingName as BuildingName);
          setSensorStatus('live');
          setLastTouchedAt(result.touchedAt || new Date().toISOString());
        } else {
          setSensorStatus('waiting');
        }
      } catch (error) {
        if (!isMounted) return;
        if (error instanceof DOMException && error.name === 'AbortError') {
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
  }, []);

  const triggerCrawl = async () => {
    const payload = {
      buildingId: String(selectedBuildingData?.id ?? 'B0'),
      buildingName: selectedBuildingData?.name ?? '본관',
      url: 'https://www.inhatc.ac.kr/kr/451/subview.do',
      replaceExisting: true,
    };

    setCrawlStatus('loading');
    setCrawlMessage(null);

    try {
      const res = await fetch(`${CRAWL_API_URL}/api/admin/crawl-building-faq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(`크롤링 실패 (status: ${res.status}): ${data?.detail ?? '서버 오류'}`);
      }
      const count = data?.faqCount ?? 0;
      setCrawlStatus('success');
      setCrawlMessage(`크롤링 완료: FAQ ${count}건 저장`);
    } catch (err: any) {
      setCrawlStatus('error');
      setCrawlMessage(err?.message ?? '크롤링 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* 관리자용: FAQ 크롤링 트리거 버튼 */}
      <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={triggerCrawl}
          disabled={crawlStatus === 'loading'}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
        >
          <SparkleIcon className="w-4 h-4" />
          {crawlStatus === 'loading' ? '크롤링 중...' : 'FAQ 크롤링'}
        </button>
        {crawlMessage && (
          <span
            className={`text-xs ${
              crawlStatus === 'error' ? 'text-red-500' : 'text-slate-700'
            } bg-white/90 rounded-lg px-3 py-2 shadow`}
          >
            {crawlMessage}
          </span>
        )}
      </div>

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

      {/* AI 어시스턴트는 화면 전체에 떠있는 버튼/패널이니까 바깥에 두는 게 자연스러움 */}
      <AiAssistant
        buildingId={selectedBuildingData?.id ?? null}
        buildingName={selectedBuildingData?.name ?? null}
        context={
          selectedBuildingData
            ? `현재 선택된 건물: ${selectedBuildingData.name}`
            : null
        }
        onSelectBuilding={(building) => setActiveBuilding(building)}
      />
    </div>
  );
};

export default App;
