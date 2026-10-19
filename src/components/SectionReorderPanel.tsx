import React from 'react';
import {
  CVSectionId,
  CV_SECTIONS_META,
  DEFAULT_SECTION_ORDER,
} from '../types/biodata';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Layers,
  Sparkles,
} from 'lucide-react';

interface SectionReorderPanelProps {
  order: CVSectionId[];
  onChange: (newOrder: CVSectionId[]) => void;
}

interface SortableItemProps {
  id: CVSectionId;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const SortableSectionItem: React.FC<SortableItemProps> = ({
  id,
  index,
  total,
  onMoveUp,
  onMoveDown,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const meta = CV_SECTIONS_META.find((m) => m.id === id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 rounded-xl border transition select-none ${
        isDragging
          ? 'bg-indigo-50 border-indigo-500 shadow-lg scale-102 ring-2 ring-indigo-500/30'
          : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1 text-slate-400 hover:text-indigo-600 cursor-grab active:cursor-grabbing rounded hover:bg-slate-100 touch-none"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
          {index + 1}
        </span>

        <div>
          <h4 className="text-xs font-bold text-slate-800 leading-tight">
            {meta?.label || id}
          </h4>
          <p className="text-[10px] text-slate-400 leading-tight">
            {meta?.description}
          </p>
        </div>
      </div>

      {/* Up/Down buttons for accessible one-click reordering */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          className="p-1 text-slate-500 hover:text-indigo-600 disabled:text-slate-300 disabled:cursor-not-allowed hover:bg-slate-100 rounded"
          title="Move up"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="p-1 text-slate-500 hover:text-indigo-600 disabled:text-slate-300 disabled:cursor-not-allowed hover:bg-slate-100 rounded"
          title="Move down"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export const SectionReorderPanel: React.FC<SectionReorderPanelProps> = ({
  order,
  onChange,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = order.indexOf(active.id as CVSectionId);
      const newIndex = order.indexOf(over.id as CVSectionId);
      onChange(arrayMove(order, oldIndex, newIndex));
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= order.length) return;
    onChange(arrayMove(order, index, targetIndex));
  };

  const handleResetOrder = () => {
    onChange(DEFAULT_SECTION_ORDER);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Reorder CV Sections
            </h2>
            <p className="text-xs text-slate-500">
              Drag and drop sections or use arrow buttons. Live CV preview updates instantly.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetOrder}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restore Default Order
        </button>
      </div>

      <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg text-xs text-indigo-900 mb-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
        <span>
          <strong>Pro-Tip:</strong> You can drag "Technical Qualification" above "Education Qualification" or move "Professional Description" right under Personal Information. Empty sections are automatically hidden on the final CV.
        </span>
      </div>

      {/* Drag & Drop Context */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {order.map((sectionId, idx) => (
              <SortableSectionItem
                key={sectionId}
                id={sectionId}
                index={idx}
                total={order.length}
                onMoveUp={() => handleMove(idx, 'up')}
                onMoveDown={() => handleMove(idx, 'down')}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
