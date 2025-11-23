import React, { useMemo, useState, useEffect } from 'react';
import type { Building, Room } from '../types';

interface BuildingInfoProps {
  building: Building;
}

const BuildingInfo: React.FC<BuildingInfoProps> = ({ building }) => {
  const directoryByLevel = useMemo(() => {
    const grouped: Record<string, Room[]> = {};
    building.directory.forEach(row => {
      if (!grouped[row.level]) grouped[row.level] = [];
      grouped[row.level].push(...row.columns.flat());
    });
    return Object.entries(grouped).sort(([levelA], [levelB]) => {
      const isBasementA = levelA.toUpperCase().startsWith('B');
      const isBasementB = levelB.toUpperCase().startsWith('B');
      const numA = parseInt(levelA);
      const numB = parseInt(levelB);

      if (isBasementA && !isBasementB) return -1;
      if (!isBasementA && isBasementB) return 1;
      return (isNaN(numA) ? levelA.localeCompare(levelB) : numA - numB);
    });
  }, [building.directory]);

  const [selectedFloorPlanLevel, setSelectedFloorPlanLevel] = useState<string>('');

  useEffect(() => {
    if (building.floorPlanLabels.length > 0) {
      setSelectedFloorPlanLevel(building.floorPlanLabels[0].level);
    } else {
      setSelectedFloorPlanLevel('');
    }
  }, [building.id, building.floorPlanLabels]);

  const currentFloorPlanImage = useMemo(() => {
    return (
      building.floorPlanLabels.find(label => label.level === selectedFloorPlanLevel)?.image || ''
    );
  }, [building.floorPlanLabels, selectedFloorPlanLevel]);

  const filteredDirectoryByLevel = useMemo(() => {
    if (!selectedFloorPlanLevel) return directoryByLevel;
    return directoryByLevel.filter(([level]) => level === selectedFloorPlanLevel);
  }, [directoryByLevel, selectedFloorPlanLevel]);

  const shouldFilterDirectory =
    selectedFloorPlanLevel !== '' && filteredDirectoryByLevel.length > 0;

  const directoryToRender = shouldFilterDirectory ? filteredDirectoryByLevel : directoryByLevel;
  const showMissingDirectoryNotice =
    selectedFloorPlanLevel !== '' && filteredDirectoryByLevel.length === 0;

  return (
    <section className="w-full mt-10 animate-fade-in">
      <h2 className="text-3xl lg:text-4xl font-semibold text-gray-900 mb-8 tracking-tight">
        {building.name}
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-12">
        <div className="w-full">
          <img
            src={building.image}
            alt={`${building.name} exterior`}
            className="w-full h-auto object-cover rounded-3xl border border-gray-200 aspect-[4/3]"
            loading="lazy"
          />
        </div>

        <div className="flex flex-col gap-10">
          <div className="flex gap-6 items-start">
            <div className="flex flex-col gap-3 text-sm font-semibold text-gray-400 text-right tracking-widest uppercase">
              {building.floorPlanLabels.map(label => (
                <button
                  key={label.level}
                  onClick={() => setSelectedFloorPlanLevel(label.level)}
                  type="button"
                  className={`transition-colors duration-200 ${
                    selectedFloorPlanLevel === label.level
                      ? 'text-[#0077cc]'
                      : 'hover:text-gray-600'
                  }`}
                >
                  {label.level}
                </button>
              ))}
            </div>
            <div className="flex-1 min-w-0 border border-gray-200 rounded-3xl p-4 bg-white">
              {currentFloorPlanImage ? (
                <img
                  src={currentFloorPlanImage}
                  alt={`${building.name} ${selectedFloorPlanLevel} floor plan`}
                  className="w-auto max-w-full max-h-[70vh] h-auto object-contain mx-auto"
                  loading="lazy"
                />
              ) : (
                <div className="w-full aspect-[3/2] bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 text-sm">
                  도면이 준비되지 않았습니다.
                </div>
              )}
            </div>
          </div>

          <div className="border border-gray-200 rounded-3xl divide-y divide-gray-200 bg-white">
            {showMissingDirectoryNotice && (
              <div className="px-5 py-6 text-sm text-center text-gray-500">
                선택한 층의 시설 정보가 없습니다.
              </div>
            )}
            {directoryToRender.map(([level, rooms]) => {
              const roomNames = rooms.map(room => room.name).join(' · ');
              return (
                <div
                  key={level}
                  className="grid grid-cols-[80px_minmax(0,1fr)] items-center"
                >
                  <div className="px-5 py-4 text-sm font-semibold text-gray-500">{level}</div>
                  <div className="px-5 py-4 text-sm text-gray-700 leading-relaxed">
                    {roomNames || '정보 준비 중'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BuildingInfo;
