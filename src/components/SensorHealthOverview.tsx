import { Cpu } from 'lucide-react';
import { parameterLabels, getSensorStatusColor } from '../utils/helpers';
import type { AllSensorHealth, ParameterKey } from '../types/api';

interface SensorHealthOverviewProps {
  data: AllSensorHealth;
}

const paramKeys: ParameterKey[] = ['ph', 'turbidity', 'temperature', 'tds', 'conductivity'];

export default function SensorHealthOverview({ data }: SensorHealthOverviewProps) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-300">Sensor Health</h3>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <Cpu className="w-3 h-3" />
          <span>Rule-Based + Statistical</span>
        </div>
      </div>

      <div className="space-y-2.5">
        {paramKeys.map((key) => {
          const sensor = data[key];
          return (
            <div key={key} className="flex items-center gap-3">
              {/* Label */}
              <span className="text-xs text-slate-400 w-24 truncate">
                {parameterLabels[key]}
              </span>

              {/* Health bar */}
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${sensor.health}%`,
                    backgroundColor:
                      sensor.health >= 90 ? '#34d399' :
                      sensor.health >= 70 ? '#fbbf24' :
                      '#f87171',
                  }}
                />
              </div>

              {/* Health % */}
              <span className="text-xs font-medium text-white w-10 text-right">
                {sensor.health}%
              </span>

              {/* Status */}
              <span className={`text-[10px] font-medium w-14 text-right ${getSensorStatusColor(sensor.status)}`}>
                {sensor.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
