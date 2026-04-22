import { describe, it, expect } from 'vitest';
import {
  sanitizePromptForJimeng,
  sanitizePromptForKling,
  rewritePromptForCompliance,
} from './promptSanitizer.js';

/* ------------------------------------------------------------------ */
/*  sanitizePromptForJimeng                                            */
/* ------------------------------------------------------------------ */

describe('sanitizePromptForJimeng', () => {
  it('returns unchanged text when no sensitive terms are present', () => {
    const input = 'A beautiful sunset over the mountains';
    expect(sanitizePromptForJimeng(input)).toBe(input);
  });

  it('replaces "brain" with "glowing sphere" (case-insensitive)', () => {
    expect(sanitizePromptForJimeng('A brain scan')).toBe('A glowing sphere scan');
    // "surgery" also matches /\bsurg\w+\b/ → "transformation"
    expect(sanitizePromptForJimeng('BRAIN surgery')).toBe('glowing sphere transformation');
    expect(sanitizePromptForJimeng('Brain anatomy')).toBe('glowing sphere anatomy');
  });

  it('replaces "brains" with "glowing spheres"', () => {
    expect(sanitizePromptForJimeng('multiple brains')).toBe('multiple glowing spheres');
  });

  it('replaces "neural pathway" and "neural pathways"', () => {
    expect(sanitizePromptForJimeng('neural pathway visualization')).toBe('flowing light streams visualization');
    expect(sanitizePromptForJimeng('neural pathways diagram')).toBe('flowing light streams diagram');
  });

  it('replaces "neural network"', () => {
    expect(sanitizePromptForJimeng('neural network diagram')).toBe('interconnected light network diagram');
  });

  it('replaces standalone "neural" (not part of longer word)', () => {
    expect(sanitizePromptForJimeng('neural activity')).toBe('luminous activity');
  });

  it('replaces "neuron" and "neurons"', () => {
    expect(sanitizePromptForJimeng('a single neuron')).toBe('a single glowing orb');
    expect(sanitizePromptForJimeng('many neurons firing')).toBe('many glowing orb firing');
  });

  it('replaces synapse variants', () => {
    expect(sanitizePromptForJimeng('synapsis connection')).toBe('spark connections connection');
    expect(sanitizePromptForJimeng('synapses firing')).toBe('spark connections firing');
  });

  it('replaces "cortex"', () => {
    expect(sanitizePromptForJimeng('the cortex region')).toBe('the layered dome structure region');
  });

  it('replaces "hippocampus"', () => {
    expect(sanitizePromptForJimeng('hippocampus memory')).toBe('curved crystal structure memory');
  });

  it('replaces "amygdala"', () => {
    expect(sanitizePromptForJimeng('the amygdala response')).toBe('the almond-shaped gem response');
  });

  it('replaces cerebral/cerebrum variants', () => {
    // cerebr* is replaced first by the cerebr regex; then "cortex" is replaced by the cortex regex
    expect(sanitizePromptForJimeng('cerebral cortex')).toBe('organic dome layered dome structure');
    expect(sanitizePromptForJimeng('cerebrum function')).toBe('organic dome function');
  });

  it('replaces "consciousness"', () => {
    expect(sanitizePromptForJimeng('human consciousness')).toBe('human inner awareness');
  });

  it('replaces "blood vessel" and "blood vessels"', () => {
    expect(sanitizePromptForJimeng('blood vessel diagram')).toBe('glowing channels diagram');
    expect(sanitizePromptForJimeng('blood vessels flowing')).toBe('glowing channels flowing');
  });

  it('replaces "blood flow"', () => {
    expect(sanitizePromptForJimeng('blood flow animation')).toBe('energy flow animation');
  });

  it('replaces standalone "blood"', () => {
    expect(sanitizePromptForJimeng('blood sample')).toBe('life energy sample');
  });

  it('replaces "organ" and "organs"', () => {
    expect(sanitizePromptForJimeng('internal organ')).toBe('internal core structure');
    // Only the matched word "organs" is replaced with "core structure" — surrounding words are preserved
    expect(sanitizePromptForJimeng('vital organs')).toBe('vital core structure');
  });

  it('replaces surgical terms', () => {
    expect(sanitizePromptForJimeng('surgery procedure')).toBe('transformation procedure');
    expect(sanitizePromptForJimeng('surgical tool')).toBe('transformation tool');
  });

  it('replaces dissection terms', () => {
    expect(sanitizePromptForJimeng('dissect the tissue')).toBe('reveal layers the tissue');
    expect(sanitizePromptForJimeng('dissection diagram')).toBe('reveal layers diagram');
  });

  it('replaces Chinese sensitive terms', () => {
    expect(sanitizePromptForJimeng('大脑扫描')).toBe('发光球体扫描');
    expect(sanitizePromptForJimeng('神经通路图')).toBe('流光线条图');
    expect(sanitizePromptForJimeng('神经元结构')).toBe('光点结构');
    expect(sanitizePromptForJimeng('神经信号')).toBe('光脉络信号');
    expect(sanitizePromptForJimeng('意识流')).toBe('内在感知流');
    expect(sanitizePromptForJimeng('血管网络')).toBe('能量通道网络');
    expect(sanitizePromptForJimeng('血液循环')).toBe('生命能量循环');
  });

  it('applies multiple replacements in sequence', () => {
    const result = sanitizePromptForJimeng('brain and blood vessel');
    expect(result).toBe('glowing sphere and glowing channels');
  });

  it('is case-insensitive for English terms', () => {
    // "BLOOD vessel" matches the blood vessel pattern (index 12) before the standalone blood
    // pattern (index 14), so it becomes "glowing channels"
    expect(sanitizePromptForJimeng('BLOOD vessel')).toBe('glowing channels');
  });
});

/* ------------------------------------------------------------------ */
/*  sanitizePromptForKling                                             */
/* ------------------------------------------------------------------ */

describe('sanitizePromptForKling', () => {
  it('returns unchanged text when no sensitive terms are present', () => {
    const input = 'A glowing crystal floating in space';
    expect(sanitizePromptForKling(input)).toBe(input);
  });

  it('replaces "chemical substance" and "chemical substances"', () => {
    expect(sanitizePromptForKling('a chemical substance')).toBe('a luminous essence');
    expect(sanitizePromptForKling('chemical substances react')).toBe('luminous essence react');
  });

  it('replaces standalone "chemical"', () => {
    expect(sanitizePromptForKling('chemical reaction')).toBe('ethereal substance reaction');
  });

  it('replaces "molecule" and "molecules"', () => {
    expect(sanitizePromptForKling('a molecule bonding')).toBe('a glowing particle bonding');
    expect(sanitizePromptForKling('molecules collide')).toBe('glowing particle collide');
  });

  it('replaces "drug" and "drugs"', () => {
    expect(sanitizePromptForKling('drug injection')).toBe('healing light flow of light');
    expect(sanitizePromptForKling('new drugs discovered')).toBe('new healing light discovered');
  });

  it('replaces "toxin" and "toxins"', () => {
    expect(sanitizePromptForKling('toxin removal')).toBe('dark mist removal');
    expect(sanitizePromptForKling('toxins in water')).toBe('dark mist in water');
  });

  it('replaces poison variants', () => {
    expect(sanitizePromptForKling('poisonous plant')).toBe('shadow plant');
    expect(sanitizePromptForKling('poison dart')).toBe('shadow dart');
  });

  it('replaces "injection" and "injections"', () => {
    expect(sanitizePromptForKling('injection site')).toBe('flow of light site');
  });

  it('replaces "dose"', () => {
    expect(sanitizePromptForKling('a single dose')).toBe('a single pulse');
  });

  it('replaces "addiction"', () => {
    expect(sanitizePromptForKling('overcoming addiction')).toBe('overcoming attachment');
  });

  it('replaces "cancer" and variants', () => {
    expect(sanitizePromptForKling('cancer cells')).toBe('dark cluster cells');
    expect(sanitizePromptForKling('cancerous growth')).toBe('dark cluster growth');
  });

  it('replaces "tumor" and "tumors"', () => {
    // "brain" → "glowing sphere", then "tumor" → "shadow mass"
    expect(sanitizePromptForKling('brain tumor')).toBe('glowing sphere shadow mass');
    expect(sanitizePromptForKling('tumors found')).toBe('shadow mass found');
  });

  it('replaces "virus"', () => {
    expect(sanitizePromptForKling('virus spreading')).toBe('dark spore spreading');
  });

  it('replaces bacteria variants', () => {
    expect(sanitizePromptForKling('bacteria colony')).toBe('tiny drifting forms colony');
    expect(sanitizePromptForKling('bacterial infection')).toBe('tiny drifting forms spread');
  });

  it('replaces infection variants', () => {
    expect(sanitizePromptForKling('infected tissue')).toBe('spread tissue');
    expect(sanitizePromptForKling('infection spread')).toBe('spread spread');
  });

  it('replaces "disease"', () => {
    expect(sanitizePromptForKling('disease progression')).toBe('shadow progression');
  });

  it('replaces "death"', () => {
    expect(sanitizePromptForKling('the death of stars')).toBe('the stillness of stars');
  });

  it('replaces die variants', () => {
    expect(sanitizePromptForKling('stars die slowly')).toBe('stars faded slowly');
    expect(sanitizePromptForKling('died away')).toBe('faded away');
    expect(sanitizePromptForKling('dies out')).toBe('faded out');
  });

  it('replaces kill variants', () => {
    expect(sanitizePromptForKling('kill switch')).toBe('vanquished switch');
    expect(sanitizePromptForKling('killing spree')).toBe('vanquished spree');
  });

  it('replaces "weapon" and "weapons"', () => {
    expect(sanitizePromptForKling('ancient weapon')).toBe('ancient tool');
    expect(sanitizePromptForKling('weapons of war')).toBe('tool of conflict');
  });

  it('replaces explosion variants', () => {
    expect(sanitizePromptForKling('explode on impact')).toBe('burst of light on impact');
    expect(sanitizePromptForKling('explosion scene')).toBe('burst of light scene');
  });

  it('replaces destruction variants', () => {
    // regex is /\bdestro\w+\b/ — matches words containing the literal substring "destro"
    // "destroy" → "d-e-s-t-r-o-y" → contains "destro" → matches
    expect(sanitizePromptForKling('destroy the city')).toBe('dissolving the city');
    // "destruction" → "d-e-s-t-r-u-c-t-i-o-n" → 6th letter is 'u' not 'o', so "destro" is absent → does not match
    expect(sanitizePromptForKling('destruction path')).toBe('destruction path');
  });

  it('replaces attack variants', () => {
    expect(sanitizePromptForKling('attack sequence')).toBe('encounter sequence');
    expect(sanitizePromptForKling('attacking forces')).toBe('encounter forces');
  });

  it('replaces "war"', () => {
    expect(sanitizePromptForKling('civil war scene')).toBe('civil conflict scene');
  });

  it('replaces Chinese sensitive terms', () => {
    expect(sanitizePromptForKling('化学物质分析')).toBe('发光精华分析');
    expect(sanitizePromptForKling('化学反应')).toBe('光华反应');
    expect(sanitizePromptForKling('分子结构')).toBe('光粒结构');
    expect(sanitizePromptForKling('药物治疗')).toBe('能量光束治疗');
    expect(sanitizePromptForKling('毒素清除')).toBe('暗雾清除');
    expect(sanitizePromptForKling('肿瘤切除')).toBe('暗影切除');
    expect(sanitizePromptForKling('病毒传播')).toBe('暗色浮尘传播');
    expect(sanitizePromptForKling('细菌感染')).toBe('微浮形体蔓延');
    expect(sanitizePromptForKling('感染扩散')).toBe('蔓延扩散');
    expect(sanitizePromptForKling('疾病症状')).toBe('暗影症状');
    expect(sanitizePromptForKling('死亡之旅')).toBe('静止之旅');
    expect(sanitizePromptForKling('杀死细胞')).toBe('消散细胞');
    expect(sanitizePromptForKling('大脑活动')).toBe('发光球体活动');
    expect(sanitizePromptForKling('神经通路激活')).toBe('流光线条激活');
    expect(sanitizePromptForKling('神经元网络')).toBe('光点网络');
    expect(sanitizePromptForKling('神经信号')).toBe('光脉络信号');
    expect(sanitizePromptForKling('意识状态')).toBe('内在感知状态');
    expect(sanitizePromptForKling('血管扩张')).toBe('能量通道扩张');
    expect(sanitizePromptForKling('血液流动')).toBe('生命能量流动');
    expect(sanitizePromptForKling('白细胞活跃')).toBe('光之守卫活跃');
    expect(sanitizePromptForKling('红细胞数量')).toBe('暖光粒子数量');
    expect(sanitizePromptForKling('器官移植')).toBe('核心结构移植');
    expect(sanitizePromptForKling('心脏跳动')).toBe('发光核心跳动');
    expect(sanitizePromptForKling('肺部呼吸')).toBe('呼吸之穹部呼吸');
    expect(sanitizePromptForKling('肝功能')).toBe('深色琥珀功能');
    expect(sanitizePromptForKling('饥饿感')).toBe('能量匮乏感');
    expect(sanitizePromptForKling('人体解剖')).toBe('光之形体解剖');
    expect(sanitizePromptForKling('生存本能')).toBe('延续本能');
  });

  it('applies multiple replacements in a single prompt', () => {
    const result = sanitizePromptForKling('drug and cancer treatment');
    expect(result).toContain('healing light');
    expect(result).toContain('dark cluster');
  });

  it('is case-insensitive for English terms', () => {
    expect(sanitizePromptForKling('DRUG overdose')).toBe('healing light overdose');
    expect(sanitizePromptForKling('Cancer research')).toBe('dark cluster research');
  });
});

/* ------------------------------------------------------------------ */
/*  rewritePromptForCompliance                                         */
/* ------------------------------------------------------------------ */

describe('rewritePromptForCompliance', () => {
  it('extracts scene description from structured prompt', () => {
    const structured = '请根据以下场景描述生成视频\n场景描述：A beautiful crystal cave\n风格要求：cinematic';
    const result = rewritePromptForCompliance(structured);
    expect(result).toContain('A beautiful crystal cave');
    expect(result).toContain('Create a cinematic motion graphics animation');
  });

  it('uses raw prompt when no structured format detected', () => {
    const plain = 'glowing particles floating in void';
    const result = rewritePromptForCompliance(plain);
    expect(result).toBe('Create a cinematic motion graphics animation: glowing particles floating in void. Smooth camera movement, professional lighting, 4K quality.');
  });

  it('strips 风格要求 section from visual description', () => {
    const prompt = '场景描述：flowing light streams\n风格要求：4K cinematic\n请直接生成';
    const result = rewritePromptForCompliance(prompt);
    expect(result).not.toContain('风格要求');
    expect(result).not.toContain('请直接生成');
    expect(result).toContain('flowing light streams');
  });

  it('applies Kling sanitization to extracted description', () => {
    const prompt = '场景描述：a cancer treatment scene\n风格要求：realistic';
    const result = rewritePromptForCompliance(prompt);
    expect(result).toContain('dark cluster');
    expect(result).not.toContain('cancer');
  });

  it('wraps result in cinematic template', () => {
    const result = rewritePromptForCompliance('simple scene');
    expect(result).toMatch(/^Create a cinematic motion graphics animation: .+\. Smooth camera movement, professional lighting, 4K quality\.$/);
  });

  it('handles empty string input', () => {
    const result = rewritePromptForCompliance('');
    expect(result).toContain('Create a cinematic motion graphics animation:');
  });

  it('handles prompt using colon variant （：）', () => {
    const prompt = '场景描述：glowing orbs in space\n风格要求：abstract';
    const result = rewritePromptForCompliance(prompt);
    expect(result).toContain('glowing orbs in space');
  });
});
