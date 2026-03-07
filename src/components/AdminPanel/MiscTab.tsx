import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { VignetteSettings, AdvancedSlideTiming } from "@/types/leaderboard";

// Controlled Input Component
function ControlledInput({ value, onChange, type = "text", disabled = false, ...props }: {
  value: string | number;
  onChange: (value: string | number) => void;
  type?: string;
  disabled?: boolean;
  [key: string]: any;
}) {
  const [tempValue, setTempValue] = useState(value.toString());

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    setTempValue(e.target.value);
  };

  const handleBlur = () => {
    if (disabled) return;
    if (type === "number") {
      const numValue = Number(tempValue) || 0;
      if (numValue !== Number(value)) {
        onChange(numValue);
      }
    } else {
      if (tempValue !== value) {
        onChange(tempValue);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === 'Enter') {
      if (type === "number") {
        const numValue = Number(tempValue) || 0;
        if (numValue !== Number(value)) {
          onChange(numValue);
        }
      } else {
        if (tempValue !== value) {
          onChange(tempValue);
        }
      }
    }
  };

  return (
    <Input
      {...props}
      value={tempValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      disabled={disabled}
    />
  );
}

interface MiscTabProps {
  config: {
    slideDuration: number;
    advancedSlideTiming: AdvancedSlideTiming;
    vignetteSettings: VignetteSettings;
  };
  onUpdateConfig: (updates: {
    slideDuration?: number;
    advancedSlideTiming?: AdvancedSlideTiming;
    vignetteSettings?: VignetteSettings;
  }) => void;
  onLogout: () => void;
}

export default function MiscTab({
  config,
  onUpdateConfig,
  onLogout
}: MiscTabProps) {
  return (
    <div className="space-y-6">
      {/* Version Information - Always at top */}
      <div className="glass-surface rounded-lg p-4 space-y-3">
        <h3 className="font-body text-sm font-semibold text-foreground">Version 2.0.11</h3>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm text-muted-foreground">Application Version</label>
            <p className="text-xs text-muted-foreground">Current version of the leaderboard system</p>
          </div>
          <div className="font-mono text-sm text-primary bg-muted px-3 py-1 rounded">v2.0.11</div>
        </div>
      </div>

      {/* Unified Configuration */}
      <div className="glass-surface rounded-lg p-4 space-y-3">
        <h3 className="font-body text-sm font-semibold text-foreground">Configuration</h3>
        
        {/* Vignette Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm text-muted-foreground">Background Vignette</label>
              <p className="text-xs text-muted-foreground">Apply gradient overlay to background image only</p>
            </div>
            <Switch 
              checked={config.vignetteSettings.enabled} 
              onCheckedChange={(enabled) => onUpdateConfig({ 
                vignetteSettings: { ...config.vignetteSettings, enabled } 
              })} 
            />
          </div>

          {/* Vignette Controls - Only show when enabled */}
          {config.vignetteSettings.enabled && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <h4 className="font-body text-sm font-semibold text-foreground">Vignette Active</h4>
              </div>
              
              {/* Vignette Radius Control */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-muted-foreground">Vignette Size</label>
                  <p className="text-xs text-muted-foreground">Coverage area of the gradient effect (smaller = more focused)</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-8">{config.vignetteSettings.radius}%</span>
                  <ControlledInput 
                    type="number" 
                    min={0} 
                    max={200} 
                    value={config.vignetteSettings.radius}
                    onChange={(radius: number) => onUpdateConfig({ 
                      vignetteSettings: { ...config.vignetteSettings, radius } 
                    })}
                    className="bg-muted border-border h-10 w-20 text-base" 
                  />
                </div>
              </div>

              {/* Vignette Strength Control */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-muted-foreground">Vignette Intensity</label>
                  <p className="text-xs text-muted-foreground">Strength of the gradient overlay</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-8">{config.vignetteSettings.strength}%</span>
                  <ControlledInput 
                    type="number" 
                    min={0} 
                    max={200} 
                    value={config.vignetteSettings.strength}
                    onChange={(strength: number) => onUpdateConfig({ 
                      vignetteSettings: { ...config.vignetteSettings, strength } 
                    })}
                    className="bg-muted border-border h-10 w-20 text-base" 
                  />
                </div>
              </div>

              {/* Reset Button */}
              <div className="flex justify-center pt-2">
                <Button
                  onClick={() => onUpdateConfig({ 
                    vignetteSettings: { radius: 30, strength: 85, enabled: true }
                  })}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  Reset to Default
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide Settings */}
      <div className="glass-surface rounded-lg p-4 space-y-3">
        <h3 className="font-body text-sm font-semibold text-foreground">Slide Settings</h3>
        
        {/* Basic Slide Duration */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm text-muted-foreground">Time per Slide (seconds)</label>
            <p className="text-xs text-muted-foreground">Duration for all slides when Advanced Timing is disabled</p>
          </div>
          <ControlledInput 
            type="number" 
            min={1} 
            max={60} 
            value={config.slideDuration}
            onChange={(slideDuration: number) => onUpdateConfig({ 
              slideDuration 
            })}
            className="bg-muted border-border h-10 w-20 text-base" 
          />
        </div>

        {/* Advanced Slide Timing Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm text-muted-foreground">Advanced Slide Timing</label>
            <p className="text-xs text-muted-foreground">Override basic timing and set specific durations for each slide type</p>
          </div>
          <Switch 
            checked={config.advancedSlideTiming.useAdvanced} 
            onCheckedChange={(useAdvanced: boolean) => onUpdateConfig({ 
              advancedSlideTiming: { ...config.advancedSlideTiming, useAdvanced } 
            })} 
          />
        </div>

        {/* Advanced Timing Options */}
        {config.advancedSlideTiming.useAdvanced && (
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <h4 className="font-body text-sm font-semibold text-foreground">Advanced Timing Active</h4>
            </div>
            <p className="text-xs text-green-400 mb-4">Specific slide durations are being applied instead of basic timing</p>
            
            <h4 className="font-body text-sm font-semibold text-foreground">Specific Slide Durations</h4>
            
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-muted-foreground">Overall Standing</label>
                  <p className="text-xs text-muted-foreground">Main leaderboard display</p>
                </div>
                <ControlledInput 
                  type="number" 
                  min={1} 
                  max={60} 
                  value={config.advancedSlideTiming.overallStanding}
                  onChange={(overallStanding: number) => onUpdateConfig({ 
                    advancedSlideTiming: { ...config.advancedSlideTiming, overallStanding } 
                  })}
                  className="bg-muted border-border h-10 w-20 text-base" 
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-muted-foreground">Games</label>
                  <p className="text-xs text-muted-foreground">Individual game slides</p>
                </div>
                <ControlledInput 
                  type="number" 
                  min={1} 
                  max={60} 
                  value={config.advancedSlideTiming.games}
                  onChange={(games: number) => onUpdateConfig({ 
                    advancedSlideTiming: { ...config.advancedSlideTiming, games } 
                  })}
                  className="bg-muted border-border h-10 w-20 text-base" 
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-muted-foreground">Hall of Champions</label>
                  <p className="text-xs text-muted-foreground">Champions display slide</p>
                </div>
                <ControlledInput 
                  type="number" 
                  min={1} 
                  max={60} 
                  value={config.advancedSlideTiming.hallOfChampions}
                  onChange={(hallOfChampions: number) => onUpdateConfig({ 
                    advancedSlideTiming: { ...config.advancedSlideTiming, hallOfChampions } 
                  })}
                  className="bg-muted border-border h-10 w-20 text-base" 
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-muted-foreground">Grand Finals</label>
                  <p className="text-xs text-muted-foreground">Grand finals matches (includes both phases)</p>
                </div>
                <ControlledInput 
                  type="number" 
                  min={1} 
                  max={60} 
                  value={config.advancedSlideTiming.grandFinals}
                  onChange={(grandFinals: number) => onUpdateConfig({ 
                    advancedSlideTiming: { ...config.advancedSlideTiming, grandFinals } 
                  })}
                  className="bg-muted border-border h-10 w-20 text-base" 
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-muted-foreground">Cluster Team Matches</label>
                  <p className="text-xs text-muted-foreground">Team championship matches</p>
                </div>
                <ControlledInput 
                  type="number" 
                  min={1} 
                  max={60} 
                  value={config.advancedSlideTiming.clusterTeamMatches}
                  onChange={(clusterTeamMatches: number) => onUpdateConfig({ 
                    advancedSlideTiming: { ...config.advancedSlideTiming, clusterTeamMatches } 
                  })}
                  className="bg-muted border-border h-10 w-20 text-base" 
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Session */}
      <div className="glass-surface rounded-lg p-4 space-y-3">
        <h3 className="font-body text-sm font-semibold text-foreground">Session</h3>
        <Button
          onClick={onLogout}
          className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </Button>
        <p className="text-xs text-muted-foreground">You will need to log in again to access admin features</p>
      </div>
    </div>
  );
}
