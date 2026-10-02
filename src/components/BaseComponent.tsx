import { ComponentProps } from '../types';

export interface BaseComponentData extends ComponentProps {
  type: string;
}

export const createComponentId = (type: string) => {
  return `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};
