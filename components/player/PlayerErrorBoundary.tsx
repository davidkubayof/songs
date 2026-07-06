'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

import { clientLog } from '@/lib/logger/client';

interface Props {
  children: ReactNode;
  onError: () => void;
}

interface State {
  hasError: boolean;
}

export class PlayerErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    clientLog({
      level: 'error',
      event: 'player_boundary_error',
      err: error.message,
      meta: { componentStack: info.componentStack?.slice(0, 200) ?? null },
    });
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
