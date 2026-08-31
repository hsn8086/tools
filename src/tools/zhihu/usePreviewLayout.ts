import { useLayoutEffect, type RefObject } from 'react';

/** 折叠行程：滚这么多像素，预览收到最小 */
const COLLAPSE_DISTANCE = 200;
/** 折叠后预览占的高度比例 */
const COLLAPSE_TO = 0.62;
/** 再小就真看不清了，到这就不再缩，改成裁切 + 底部渐隐 */
const MIN_SCALE = 0.42;
const CARD_W = 375;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * 预览的尺寸策略。两条规则：
 *
 * 1. **优先让整张卡片露全**。缩放取「按宽度铺满」和「按高度装下」里更小的那个，
 *    所以答案再长也看得到结尾，而不是齐刷刷切一刀。缩到 MIN_SCALE 还装不下，
 *    才退回裁切，底部用渐隐说明还有内容。
 * 2. **移动端跟着滚动收起**。预览用 fixed 定位、内容留一段固定的 padding-top
 *    （iOS 大标题、MD 折叠顶栏都是这个套路）。留在文档流里改高度会变成
 *    滚动 → 变矮 → 内容上移 → 滚动位置又变，自己咬自己的尾巴。
 *    缩放严格跟着 scrollY，不加过渡：手指停下画面就得停下。
 */
export function usePreviewLayout(
  frameRef: RefObject<HTMLDivElement | null>,
  innerRef: RefObject<HTMLDivElement | null>,
  cardRef: RefObject<HTMLDivElement | null>,
) {
  useLayoutEffect(() => {
    const frame = frameRef.current;
    const inner = innerRef.current;
    const card = cardRef.current;
    if (!frame || !inner || !card) return;

    const mobile = window.matchMedia('(max-width: 899px)');
    let raf = 0;
    let fitW = 1;
    let availH = 0;
    let cardH = 0;

    const measure = () => {
      const isMobile = mobile.matches;
      // 卡片永远是 375px 宽，容器窄了就整体缩，绝不改卡片内部尺寸
      fitW = clamp((frame.clientWidth - (isMobile ? 0 : 32)) / CARD_W, 0.1, 1);
      cardH = card.offsetHeight || 1;
      availH = isMobile
        ? window.innerHeight * 0.46
        : // 桌面端：吸顶位置往下到视口底部，留出操作行和内边距
          Math.max(240, window.innerHeight - frame.getBoundingClientRect().top - 96);
      document.documentElement.style.setProperty('--preview-max', `${availH}px`);
      apply();
    };

    const apply = () => {
      raf = 0;
      const t = mobile.matches ? clamp(window.scrollY / COLLAPSE_DISTANCE, 0, 1) : 0;
      const room = availH * (1 - (1 - COLLAPSE_TO) * t);
      const scale = clamp(Math.min(fitW, room / cardH), MIN_SCALE, 1);
      const shown = Math.min(cardH * scale, room);

      inner.style.transform = `scale(${scale})`;
      frame.style.height = `${shown}px`;
      // 只有真的没装下才需要渐隐提示
      frame.dataset.clipped = cardH * scale > shown + 1 ? 'true' : 'false';
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    const ro = new ResizeObserver(measure);
    ro.observe(frame);
    ro.observe(card);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    mobile.addEventListener('change', measure);
    measure();

    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      mobile.removeEventListener('change', measure);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [frameRef, innerRef, cardRef]);
}
