import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ExportCenter from '@/components/studio/export/ExportCenter';

const mockSetExportConfig = vi.fn();
const mockResetExportConfig = vi.fn();

const defaultExportConfig = {
  project: false, blueprint: false, context: false, markdown: false,
  html: false, zip: true, json: false, pdf: false,
  openapi: false, terraform: false, deploymentReport: false,
};

vi.mock('@/store/workspaceStore', () => ({
  useWorkspaceStore: Object.assign(
    (selector?: any) => {
      const state = {
        exportConfig: defaultExportConfig,
        setExportConfig: mockSetExportConfig,
        resetExportConfig: mockResetExportConfig,
      };
      return typeof selector === 'function' ? selector(state) : state;
    },
    { getState: () => ({}) },
  ),
}));

vi.mock('@/lib/sync/notifications', () => ({
  studioNotifications: { success: vi.fn(), info: vi.fn() },
}));

describe('ExportCenter', () => {
  it('renders export title', () => {
    render(<ExportCenter onClose={vi.fn()} />);
    expect(screen.getByText('Export Center')).toBeInTheDocument();
  });

  it('renders all export options', () => {
    render(<ExportCenter onClose={vi.fn()} />);
    expect(screen.getByText('Full Project')).toBeInTheDocument();
    expect(screen.getByText('Blueprint')).toBeInTheDocument();
    expect(screen.getByText('Context')).toBeInTheDocument();
    expect(screen.getByText('HTML Export')).toBeInTheDocument();
    expect(screen.getByText('ZIP Archive')).toBeInTheDocument();
    expect(screen.getByText('JSON Export')).toBeInTheDocument();
    expect(screen.getByText('PDF Report')).toBeInTheDocument();
    expect(screen.getByText('OpenAPI Spec')).toBeInTheDocument();
    expect(screen.getByText('Terraform')).toBeInTheDocument();
    expect(screen.getByText('Deployment Report')).toBeInTheDocument();
  });

  it('shows export button with count', () => {
    render(<ExportCenter onClose={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    const exportBtn = buttons.find((b) => b.textContent?.includes('Export'));
    expect(exportBtn).toBeTruthy();
    expect(exportBtn!.textContent).toContain('1');
  });

  it('calls setExportConfig on checkbox click', () => {
    render(<ExportCenter onClose={vi.fn()} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(mockSetExportConfig).toHaveBeenCalled();
  });

  it('has reset button', () => {
    render(<ExportCenter onClose={vi.fn()} />);
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });
});
