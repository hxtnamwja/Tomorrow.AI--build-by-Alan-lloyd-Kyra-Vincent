import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Atom, FlaskConical, Hash, Dna, Monitor, Satellite, Globe, Palette,
  Calculator, Brain, Microscope, Rocket, Leaf, Music, PenTool, Code2,
  Cpu, Database, BookMarked, Landmark, Languages, Shapes, Puzzle,
  Wrench, Compass, Lightbulb, Camera, Gamepad2, School, Library,
  GraduationCap, Ruler, Sigma, Waves, Orbit, Telescope, Beaker,
  CircuitBoard, Blocks, NotebookTabs, Map, Gem, Sparkles
} from 'lucide-react';

export const PUBLIC_CATEGORY_ICON_OPTIONS: Array<{ id: string; label: string; Icon: LucideIcon }> = [
  { id: 'atom', label: '物理', Icon: Atom },
  { id: 'flask', label: '化学', Icon: FlaskConical },
  { id: 'hash', label: '数学', Icon: Hash },
  { id: 'dna', label: '生命', Icon: Dna },
  { id: 'monitor', label: '计算机', Icon: Monitor },
  { id: 'satellite', label: '天文', Icon: Satellite },
  { id: 'globe', label: '地球', Icon: Globe },
  { id: 'palette', label: '创意', Icon: Palette },
  { id: 'calculator', label: '计算', Icon: Calculator },
  { id: 'brain', label: '思维', Icon: Brain },
  { id: 'microscope', label: '实验', Icon: Microscope },
  { id: 'rocket', label: '探索', Icon: Rocket },
  { id: 'leaf', label: '生态', Icon: Leaf },
  { id: 'music', label: '音乐', Icon: Music },
  { id: 'pen-tool', label: '设计', Icon: PenTool },
  { id: 'code', label: '代码', Icon: Code2 },
  { id: 'cpu', label: '硬件', Icon: Cpu },
  { id: 'database', label: '数据', Icon: Database },
  { id: 'book-marked', label: '阅读', Icon: BookMarked },
  { id: 'landmark', label: '人文', Icon: Landmark },
  { id: 'languages', label: '语言', Icon: Languages },
  { id: 'shapes', label: '几何', Icon: Shapes },
  { id: 'puzzle', label: '逻辑', Icon: Puzzle },
  { id: 'wrench', label: '工具', Icon: Wrench },
  { id: 'compass', label: '导航', Icon: Compass },
  { id: 'lightbulb', label: '灵感', Icon: Lightbulb },
  { id: 'camera', label: '视觉', Icon: Camera },
  { id: 'gamepad', label: '互动', Icon: Gamepad2 },
  { id: 'school', label: '课程', Icon: School },
  { id: 'library', label: '知识库', Icon: Library },
  { id: 'graduation-cap', label: '学习', Icon: GraduationCap },
  { id: 'ruler', label: '测量', Icon: Ruler },
  { id: 'sigma', label: '公式', Icon: Sigma },
  { id: 'waves', label: '波动', Icon: Waves },
  { id: 'orbit', label: '轨道', Icon: Orbit },
  { id: 'telescope', label: '观测', Icon: Telescope },
  { id: 'beaker', label: '研究', Icon: Beaker },
  { id: 'circuit-board', label: '电路', Icon: CircuitBoard },
  { id: 'blocks', label: '模块', Icon: Blocks },
  { id: 'notebook-tabs', label: '笔记', Icon: NotebookTabs },
  { id: 'map', label: '地图', Icon: Map },
  { id: 'gem', label: '精选', Icon: Gem },
  { id: 'sparkles', label: '其他', Icon: Sparkles }
];

const BUILT_IN_CATEGORY_ICON_MAP: Record<string, string> = {
  'cat-physics': 'atom',
  'cat-chemistry': 'flask',
  'cat-mathematics': 'hash',
  'cat-biology': 'dna',
  'cat-computer-science': 'monitor',
  'cat-astronomy': 'satellite',
  'cat-earth-science': 'globe',
  'cat-creative-tools': 'palette'
};

export const PublicCategoryIcon = ({
  icon,
  className = 'w-4 h-4'
}: {
  icon?: string;
  className?: string;
}) => {
  const normalizedIcon = icon ? BUILT_IN_CATEGORY_ICON_MAP[icon] || icon : icon;
  const Icon = PUBLIC_CATEGORY_ICON_OPTIONS.find(item => item.id === normalizedIcon)?.Icon || Sparkles;
  return <Icon className={className} />;
};
