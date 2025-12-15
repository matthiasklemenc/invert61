export type PredefinedTemplate = 'colors' | 'invert-white' | 'invert-black';
export type TemplateName = PredefinedTemplate | 'custom';


/**
 * Returns className snippets ONLY for the homepage controls section:
 * - toolbar buttons (“Select All”, “Settings”)
 * - genre chips (default + selected)
 * - big PLAY skateboard button (wrapper + text)
 *
 * Your existing “colors” design stays as-is by returning empty overrides.
 * The “invert” design: black bg, white text; selected chip = #c52323.
 */
export function getTemplateClasses(tmpl: TemplateName) {
  if (tmpl === 'invert-white') {
    return {
      toolbarBtn: '',
      toolbarBtnActive: '',
      genreBtn:
        'px-3 py-2 rounded-xl bg-white text-black border border-black/20 hover:bg-gray-200 transition',
      genreBtnActive:
        'bg-[#c52323] text-white border-transparent',
      playWrap: '',
      playText: '',
    } as const;
  }
  
  if (tmpl === 'invert-black') {
    return {
      toolbarBtn: '',
      toolbarBtnActive: '',
      genreBtn:
        'px-3 py-2 rounded-xl bg-black text-white border border-white/30 hover:border-white/70 transition',
      genreBtnActive:
        'bg-[#c52323] text-white border-transparent',
      playWrap: '',
      playText: '',
    } as const;
  }
  
  if (tmpl === 'custom') {
    const textShadow = '[text-shadow:_0_1px_3px_rgb(0_0_0_/_0.6)]';
    const baseStyle = `bg-black/20 backdrop-blur-sm text-white/95 border border-white/20 hover:bg-black/40 ${textShadow}`;
    return {
      toolbarBtn: baseStyle,
      toolbarBtnActive: `bg-[#c52323]/40 backdrop-blur-sm text-white border border-red-500/60 ${textShadow}`,
      genreBtn: baseStyle,
      genreBtnActive: `bg-[#c52323]/40 backdrop-blur-sm text-white border border-red-500/60 ring-2 ring-white/80 ${textShadow}`,
      playWrap: '',
      playText: '',
    } as const;
  }

  // default “colors”: no overrides so your current styling remains unchanged
  return {
    toolbarBtn: '',
    toolbarBtnActive: '',
    genreBtn: '',
    genreBtnActive: '',
    playWrap: '',
    playText: '',
  } as const;
}