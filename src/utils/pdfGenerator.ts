/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export * from './exportUtils';
import { downloadCvPdf, printCvDocument } from './exportUtils';

export async function exportBioDataToPdf(
  elementId: string = 'biodata-print-area',
  candidateName?: string
): Promise<boolean> {
  return await downloadCvPdf(elementId, candidateName);
}

export function printBioDataDocument(_elementId: string = 'biodata-print-area'): void {
  printCvDocument();
}
