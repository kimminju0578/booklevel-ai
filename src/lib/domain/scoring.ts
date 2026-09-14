export function calculateLevel(earned: number, maximum: number) {
  if (!Number.isFinite(earned)||!Number.isFinite(maximum)||maximum<=0||earned<0||earned>maximum) throw new Error("INVALID_SCORE");
  const score=earned/maximum;
  return score<.25?1:score<.45?2:score<.65?3:score<.82?4:5;
}
export function recommendationScore(input: {level:number;difficulty:number;interest:number;gap:number;novelty:number;community?:number}) {
  return .4*Math.max(0,1-Math.abs(input.level-input.difficulty)/2)+.25*input.interest+.2*input.gap+.1*input.novelty+.05*(input.community??.5);
}
export function interestWeight(priority: number | undefined) {
  if (priority === 1) return 1;
  if (priority === 2) return 0.8;
  return 0.5;
}
export function knowledgeGap(topics: {topic:string;importance:number}[], accuracy: Record<string,number>) {
  const known=topics.filter(t=>Object.hasOwn(accuracy,t.topic));
  const total=known.reduce((s,t)=>s+t.importance,0);
  return total?known.reduce((s,t)=>s+(1-accuracy[t.topic])*t.importance,0)/total:.5;
}
export function elapsedTime(start: string, end: string, limit: number|null) {
  const seconds=Math.max(0,Math.floor((Date.parse(end)-Date.parse(start))/1000));
  if(!Number.isFinite(seconds)) throw new Error('INVALID_DATE');
  return {elapsedSeconds:seconds,overtimeSeconds:limit===null?0:Math.max(0,seconds-limit)};
}
export function formatDuration(seconds:number) {
  const value=Math.max(0,Math.floor(seconds));
  return `${Math.floor(value/60).toString().padStart(2,'0')}:${(value%60).toString().padStart(2,'0')}`;
}
export function timeFeedback(elapsedSeconds: number, overtimeSeconds: number) {
  const describe = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${minutes ? `${minutes}분 ` : ""}${rest ? `${rest}초` : ""}`.trim();
  };
  const elapsed = describe(Math.max(0, Math.floor(elapsedSeconds))) || "0초";
  const overtime = Math.max(0, Math.floor(overtimeSeconds));
  return overtime
    ? `${elapsed} 동안 작성했고, 제한 시간을 ${describe(overtime)} 넘겨 마무리했습니다. 작성 시간은 글의 점수에 반영하지 않았습니다.`
    : `${elapsed} 동안 작성했습니다. 작성 시간은 글의 점수에 반영하지 않았습니다.`;
}
