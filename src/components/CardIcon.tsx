import React from 'react';
import {
  Zap,
  GitMerge,
  Minimize2,
  RotateCcw,
  Sliders,
  Sparkles,
  Disc,
  AlertTriangle,
  MinusCircle,
  ShieldAlert,
  Target,
  Activity,
  Wind,
  CornerUpLeft,
  Flame,
  Droplet,
  Scissors,
  Undo,
  Magnet,
  EyeOff,
  Link,
  Radio,
  Crosshair,
  Rocket,
  ShieldCheck,
  UploadCloud,
  Unlock,
  WifiOff,
  Snowflake,
  Trash2,
  PackageX,
  Repeat,
  Lock,
  CopyPlus,
  CheckSquare,
  Key,
  FastForward,
  Rewind,
  Navigation,
  Anchor,
  Ghost,
  Copy,
  Swords,
  Ban,
  Skull,
  Orbit,
  HelpCircle
} from 'lucide-react';

interface CardIconProps {
  name: string;
  className?: string;
}

export const CardIcon: React.FC<CardIconProps> = ({ name, className = 'w-6 h-6 text-cyan-400' }) => {
  switch (name) {
    case 'Zap': return <Zap className={className} />;
    case 'GitMerge': return <GitMerge className={className} />;
    case 'Minimize2': return <Minimize2 className={className} />;
    case 'RotateCcw': return <RotateCcw className={className} />;
    case 'Sliders': return <Sliders className={className} />;
    case 'Sparkles': return <Sparkles className={className} />;
    case 'Disc': return <Disc className={className} />;
    case 'AlertTriangle': return <AlertTriangle className={className} />;
    case 'MinusCircle': return <MinusCircle className={className} />;
    case 'ShieldAlert': return <ShieldAlert className={className} />;
    case 'Target': return <Target className={className} />;
    case 'Activity': return <Activity className={className} />;
    case 'Wind': return <Wind className={className} />;
    case 'CornerUpLeft': return <CornerUpLeft className={className} />;
    case 'Flame': return <Flame className={className} />;
    case 'Droplet': return <Droplet className={className} />;
    case 'Scissors': return <Scissors className={className} />;
    case 'Undo': return <Undo className={className} />;
    case 'Magnet': return <Magnet className={className} />;
    case 'EyeOff': return <EyeOff className={className} />;
    case 'Link': return <Link className={className} />;
    case 'Radio': return <Radio className={className} />;
    case 'Crosshair': return <Crosshair className={className} />;
    case 'Rocket': return <Rocket className={className} />;
    case 'ShieldCheck': return <ShieldCheck className={className} />;
    case 'UploadCloud': return <UploadCloud className={className} />;
    case 'Unlock': return <Unlock className={className} />;
    case 'WifiOff': return <WifiOff className={className} />;
    case 'Snowflake': return <Snowflake className={className} />;
    case 'Trash2': return <Trash2 className={className} />;
    case 'PackageX': return <PackageX className={className} />;
    case 'Repeat': return <Repeat className={className} />;
    case 'Lock': return <Lock className={className} />;
    case 'CopyPlus': return <CopyPlus className={className} />;
    case 'CheckSquare': return <CheckSquare className={className} />;
    case 'Key': return <Key className={className} />;
    case 'FastForward': return <FastForward className={className} />;
    case 'Rewind': return <Rewind className={className} />;
    case 'Navigation': return <Navigation className={className} />;
    case 'Anchor': return <Anchor className={className} />;
    case 'Ghost': return <Ghost className={className} />;
    case 'Copy': return <Copy className={className} />;
    case 'Swords': return <Swords className={className} />;
    case 'Ban': return <Ban className={className} />;
    case 'Skull': return <Skull className={className} />;
    case 'Orbit': return <Orbit className={className} />;
    default: return <HelpCircle className={className} />;
  }
};
