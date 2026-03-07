import React, { useState } from "react";
import { Plus, Trash2, Archive } from "lucide-react";
import { ALL_CLUSTERS, ClusterName } from "@/types/leaderboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Controlled Input Component
function ControlledInput({ value, onChange, type = "text", disabled = false, ...props }: {
  value: string | number;
  onChange: (value: string | number) => void;
  type?: string;
  disabled?: boolean;
  [key: string]: any;
}) {
  const [tempValue, setTempValue] = useState(value.toString());

  // Update local state when prop changes
  React.useEffect(() => {
    setTempValue(value.toString());
  }, [value]);

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
      handleBlur(); // Call handleBlur instead of duplicating logic
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

interface GrandFinalsTabProps {
  grandFinals: any;
  newFinalsTitle: string;
  newFinalsA: ClusterName;
  newFinalsB: ClusterName;
  onNewFinalsTitleChange: (value: string) => void;
  onNewFinalsAChange: (value: ClusterName) => void;
  onNewFinalsBChange: (value: ClusterName) => void;
  onAddFinals: () => void;
  onUpdateGrandFinals: (finalId: string, updates: any) => void;
  onArchiveGrandFinals: (finalId: string) => void;
  onUnarchiveGrandFinals: (finalId: string) => void;
  onRemoveGrandFinals: (finalId: string) => void;
}

export default function GrandFinalsTab({
  grandFinals,
  newFinalsTitle,
  newFinalsA,
  newFinalsB,
  onNewFinalsTitleChange,
  onNewFinalsAChange,
  onNewFinalsBChange,
  onAddFinals,
  onUpdateGrandFinals,
  onArchiveGrandFinals,
  onUnarchiveGrandFinals,
  onRemoveGrandFinals
}: GrandFinalsTabProps) {
  const activeFinals = grandFinals.active;
  const archivedFinals = grandFinals.archived;

  return (
    <div className="space-y-6">
      {/* Add new */}
      <div className="glass-surface rounded-lg p-4 space-y-3">
        <h3 className="font-body text-sm font-semibold text-foreground">Add Grand Finals</h3>
        <Input 
          value={newFinalsTitle} 
          onChange={(e) => onNewFinalsTitleChange(e.target.value)} 
          placeholder="Event title..." 
          className="bg-muted border-border" 
          onKeyDown={(e) => e.key === 'Enter' && onAddFinals()}
        />
        <div className="grid grid-cols-2 gap-3">
          <Select value={newFinalsA} onValueChange={(v) => onNewFinalsAChange(v as ClusterName)}>
            <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
            <SelectContent className="z-[200]">{ALL_CLUSTERS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={newFinalsB} onValueChange={(v) => onNewFinalsBChange(v as ClusterName)}>
            <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
            <SelectContent className="z-[200]">{ALL_CLUSTERS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button onClick={onAddFinals} size="sm" className="bg-primary text-primary-foreground w-full"><Plus className="w-4 h-4 mr-2" /> Add Match</Button>
      </div>

      {/* Existing matches */}
      {activeFinals.map((match: any) => (
        <div key={match.id} className="glass-surface rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Input value={match.eventTitle} onChange={(e) => onUpdateGrandFinals(match.id, { eventTitle: e.target.value })} className="bg-muted border-border font-bold" />
            <div className="flex gap-2">
              <button onClick={() => onArchiveGrandFinals(match.id)} className="text-muted-foreground hover:text-yellow-500 transition-colors" title="Archive">
                <Archive className="w-4 h-4" />
              </button>
              <button onClick={() => onRemoveGrandFinals(match.id)} className="text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Active in slides</span>
            <Switch checked={match.isActive} onCheckedChange={(checked) => onUpdateGrandFinals(match.id, { isActive: checked })} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Voting enabled</span>
            <Switch checked={match.votingEnabled} onCheckedChange={(checked) => onUpdateGrandFinals(match.id, { votingEnabled: checked })} />
          </div>
          {match.votingEnabled && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Votes A</label>
                <ControlledInput 
                  type="number" 
                  min={0} 
                  value={match.betsA}
                  onChange={(newValue: number) => onUpdateGrandFinals(match.id, { betsA: newValue })}
                  className="bg-muted border-border" 
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Votes B</label>
                <ControlledInput 
                  type="number" 
                  min={0} 
                  value={match.betsB}
                  onChange={(newValue: number) => onUpdateGrandFinals(match.id, { betsB: newValue })}
                  className="bg-muted border-border" 
                />
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Archived matches */}
      {archivedFinals.length > 0 && (
        <>
          <h3 className="font-body text-sm font-semibold text-muted-foreground mt-6">Archived Matches</h3>
          {archivedFinals.map((match: any) => (
            <div key={match.id} className="glass-surface rounded-lg p-4 space-y-3 opacity-60">
              <div className="flex items-center justify-between">
                <Input value={match.eventTitle} onChange={(e) => onUpdateGrandFinals(match.id, { eventTitle: e.target.value })} className="bg-muted border-border font-bold" />
                <div className="flex gap-2">
                  <button onClick={() => onUnarchiveGrandFinals(match.id)} className="text-muted-foreground hover:text-green-500 transition-colors" title="Unarchive">
                    <Archive className="w-4 h-4" />
                  </button>
                  <button onClick={() => onRemoveGrandFinals(match.id)} className="text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">Archived - not shown in slides</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
