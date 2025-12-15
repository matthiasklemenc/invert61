// C:\Users\user\Desktop\invert\build\LicenseModal.tsx

import React, { useState } from 'react';
import { Song } from './types';

const LicenseModal: React.FC<{ song: Song; onClose: () => void }> = ({
  song,
  onClose,
}) => {
  const getLicenseInfo = (song: Song) => {
    const licenseUrl = song.license || '';
    const canDownload = !!song.audiodownload_allowed;

    const defaults = {
      description:
        'License information could not be determined. Please check the full license details.',
      canDownload: canDownload,
      canUseNonCommercially: false,
      canUseCommercially: false,
      canSell: false,
      licenseName: 'Unknown License',
      deedUrl: licenseUrl,
    };

    if (!licenseUrl || typeof licenseUrl !== 'string') return defaults;

    const url = licenseUrl.toLowerCase();
    let licenseName = 'Unknown';
    let rawVersion = '4.0';
    const versionMatch = url.match(/(\d\.\d)/);
    if (versionMatch) rawVersion = versionMatch[1];

    // CC0 / Public Domain
    if (url.includes('/publicdomain/zero/')) {
      // For CC0 we keep the original version and link as-is (no 4.0 upgrade)
      return {
        description:
          'This song is in the Public Domain. View full license details.',
        canDownload: canDownload,
        canUseNonCommercially: true,
        canUseCommercially: true,
        canSell: true,
        licenseName: `CC0 ${rawVersion}`,
        deedUrl: `https://creativecommons.org/publicdomain/zero/${rawVersion}/`,
      };
    }

    // Standard CC types
    let type = '';
    if (url.includes('/licenses/by-nc-sa/')) type = 'by-nc-sa';
    else if (url.includes('/licenses/by-nc-nd/')) type = 'by-nc-nd';
    else if (url.includes('/licenses/by-nc/')) type = 'by-nc';
    else if (url.includes('/licenses/by-sa/')) type = 'by-sa';
    else if (url.includes('/licenses/by-nd/')) type = 'by-nd';
    else if (url.includes('/licenses/by/')) type = 'by';
    else return defaults;

    licenseName = `CC ${type.toUpperCase()}`;
    const canModify = !type.includes('nd');
    const canUseCommercially = !type.includes('nc');

    let description = `You are free to use this song for ${
      canUseCommercially ? 'commercial purposes' : 'non-commercial purposes only'
    }, as long as you give credit to the artist.`;
    if (!canModify) description += ' You may not modify the original work.';

    // If the original license is an older version (e.g. 3.0),
    // link directly to the 4.0 deed page instead.
    const numericVersion = parseFloat(rawVersion);
    const linkVersion =
      !Number.isNaN(numericVersion) && numericVersion < 4 ? '4.0' : rawVersion;

    return {
      description,
      canDownload: canDownload,
      canUseNonCommercially: true,
      canUseCommercially,
      canSell: false,
      // Keep the displayed version as the original one (e.g. "CC BY-SA 3.0")
      licenseName: `${licenseName} ${rawVersion}`,
      // But link to the newer 4.0 deed when appropriate (e.g. .../4.0/deed.en)
      deedUrl: `https://creativecommons.org/licenses/${type}/${linkVersion}/deed.en`,
    };
  };

  const {
    description,
    canDownload,
    canUseNonCommercially,
    canUseCommercially,
    canSell,
    licenseName,
    deedUrl,
  } = getLicenseInfo(song);

  const [hasConfirmed, setHasConfirmed] = useState(false);
  const isDownloadEnabled = canDownload && hasConfirmed;

  const PermissionRow: React.FC<{ label: string; allowed: boolean }> = ({
    label,
    allowed,
  }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-700 text-white">
      <span className="text-gray-300">{label}</span>
      {allowed ? (
        <span className="text-green-400 font-bold flex items-center gap-1">
          ✓ YES
        </span>
      ) : (
        <span className="text-red-400 font-bold flex items-center gap-1">
          ✗ NO
        </span>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full text-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold">{licenseName}</h3>
          <button
            onClick={onClose}
            className="text-3xl text-gray-400 hover:text-white"
            aria-label="Close license information"
          >
            &times;
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-400 mb-4 text-sm">{description}</p>

        {/* Artist Info */}
        <div className="mb-4">
          <p className="text-gray-400 text-sm">Artist: {song.artist_name}</p>
          {song.artist_url && (
            <a
              href={song.artist_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:underline"
            >
              Visit artist&apos;s page
            </a>
          )}
        </div>

        {/* Permission matrix */}
        <div className="space-y-2 my-4">
          <PermissionRow label="Download the song" allowed={canDownload} />
          <PermissionRow
            label="Use in non-commercial projects"
            allowed={canUseNonCommercially}
          />
          <PermissionRow
            label="Use in commercial projects"
            allowed={canUseCommercially}
          />
          <PermissionRow label="Sell the song" allowed={canSell} />
        </div>

        {/* License link + confirmation + final download */}
        <div className="mt-4 flex flex-col items-center">
          <a
            href={deedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:underline text-center"
          >
            View full license details
          </a>

          {/* Confirmation text + checkbox */}
          <label className="mt-3 flex items-center gap-2 text-xs text-gray-300 text-center cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={hasConfirmed}
              onChange={(e) => setHasConfirmed(e.target.checked)}
            />
            <span>
              I have read and understood which license this song is subject to.
            </span>
          </label>

          {canDownload && (
            <a
              href={isDownloadEnabled ? song.audio : undefined}
              download={isDownloadEnabled ? song.name : undefined}
              target={isDownloadEnabled ? '_blank' : undefined}
              rel={isDownloadEnabled ? 'noopener noreferrer' : undefined}
              onClick={(e) => {
                if (!isDownloadEnabled) {
                  e.preventDefault();
                }
              }}
              className={`mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 rounded text-sm w-full sm:w-auto ${
                isDownloadEnabled
                  ? 'bg-emerald-700 text-white hover:bg-emerald-600 cursor-pointer'
                  : 'bg-gray-600 text-gray-300 opacity-60 cursor-not-allowed'
              }`}
              aria-disabled={!isDownloadEnabled}
            >
              {/* Inline download icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Download the song!</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default LicenseModal;
