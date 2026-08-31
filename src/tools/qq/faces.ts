/** 可选的头像预设：QQ 经典小黄脸，取自 koishijs/QFace（MIT）的静态 PNG。
 *  下到 public/assets/qqface/ 走同域，导出截图时不会有跨域问题。
 *  默认头像不是这些，是 defaults.ts 里那只企鹅。*/
export interface Face {
  id: string;
  name: string;
}

export const FACE_DIR = '/assets/qqface';

export const faceUrl = (id: string) => `${FACE_DIR}/s${id}.png`;

export const FACES: Face[] = [
  { id: '14', name: '微笑' },
  { id: '1', name: '撇嘴' },
  { id: '2', name: '色' },
  { id: '3', name: '发呆' },
  { id: '4', name: '得意' },
  { id: '5', name: '流泪' },
  { id: '6', name: '害羞' },
  { id: '7', name: '闭嘴' },
  { id: '8', name: '睡' },
  { id: '9', name: '大哭' },
  { id: '10', name: '尴尬' },
  { id: '11', name: '发怒' },
  { id: '12', name: '调皮' },
  { id: '13', name: '呲牙' },
  { id: '0', name: '惊讶' },
  { id: '15', name: '难过' },
  { id: '16', name: '酷' },
  { id: '96', name: '冷汗' },
  { id: '18', name: '抓狂' },
  { id: '19', name: '吐' },
  { id: '20', name: '偷笑' },
  { id: '21', name: '可爱' },
  { id: '22', name: '白眼' },
  { id: '23', name: '傲慢' },
  { id: '25', name: '困' },
  { id: '26', name: '惊恐' },
  { id: '27', name: '流汗' },
  { id: '28', name: '憨笑' },
  { id: '29', name: '悠闲' },
  { id: '30', name: '奋斗' },
  { id: '31', name: '咒骂' },
  { id: '32', name: '疑问' },
  { id: '33', name: '嘘' },
  { id: '34', name: '晕' },
  { id: '36', name: '衰' },
  { id: '37', name: '骷髅' },
  { id: '38', name: '敲打' },
  { id: '39', name: '再见' },
  { id: '41', name: '发抖' },
  { id: '42', name: '爱情' },
  { id: '46', name: '猪头' },
  { id: '49', name: '拥抱' },
  { id: '78', name: '握手' },
  { id: '79', name: '胜利' },
  { id: '118', name: '抱拳' },
  { id: '119', name: '勾引' },
  { id: '120', name: '拳头' },
  { id: '124', name: 'OK' },
];
