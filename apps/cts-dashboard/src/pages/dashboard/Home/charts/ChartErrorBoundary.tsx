import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorState } from "../components/states";

interface ChartErrorBoundaryProps {
  height: number;
  children: ReactNode;
}

interface ChartErrorBoundaryState {
  error: Error | null;
}

export default class ChartErrorBoundary extends Component<ChartErrorBoundaryProps, ChartErrorBoundaryState> {
  state: ChartErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ChartErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Chart failed to render", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorState
          height={this.props.height}
          title="This chart could not be displayed"
          description="Something went wrong while drawing the chart. Retrying usually fixes it."
          onRetry={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}
