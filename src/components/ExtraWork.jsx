import { useState, useMemo } from "react";
import exerciseDB from "../data/exercises.json";
import conditionsDB from "../data/conditions.json";
import ExerciseImage from "./ExerciseImage.jsx";
import { getInjuries } from "../utils/injuries.js";

// ═══════════════════════════════════════════════════════════════
// Extra Work Add-Ons — McKenzie protocols, yoga, foam rolling, etc.
// ═══════════════════════════════════════════════════════════════

const C={bg:"#060b18",bgCard:"#0d1425",bgElevated:"#162040",bgGlass:"rgba(255,255,255,0.04)",border:"rgba(255,255,255,0.08)",text:"#e8ecf4",textMuted:"#7a8ba8",textDim:"#4a5a78",teal:"#00d2c8",tealBg:"rgba(0,210,200,0.08)",success:"#22c55e",danger:"#ef4444",warning:"#eab308",info:"#3b82f6",orange:"#f97316",purple:"#a855f7"};
const Card=({children,style,onClick})=><div onClick={onClick} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:14,padding:14,cursor:onClick?"pointer":"default",...style}}>{children}</div>;
const Badge=({children,color=C.teal})=><span style={{display:"inline-flex",padding:"2px 7px",borderRadius:5,fontSize:8,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color,background:color+"15"}}>{children}</span>;

const MCK_NOTE = "These exercises follow the McKenzie Method sequence. Do them in order. If any exercise increases your symptoms, stop and return to the previous step.";

const PROTOCOLS = [
  {id:"mck_back",label:"McKenzie Back",icon:"🔙",tag:"mckenzie_back_chain",source:"McKenzie R. 'Treat Your Own Back'",flexionStart:5},
  {id:"mck_neck",label:"McKenzie Neck",icon:"😐",tag:"mckenzie_neck_chain",source:"McKenzie R. 'Treat Your Own Neck'",flexionStart:6},
  {id:"mck_shoulder",label:"McKenzie Shoulder",icon:"💪",tag:"mckenzie_shoulder_chain",source:"McKenzie R. 'Treat Your Own Shoulder'"},
  {id:"mck_knee",label:"McKenzie Knee",icon:"🦵",tag:"mckenzie_knee_chain",source:"McKenzie R. 'Treat Your Own Knee'"},
  {id:"mck_hip",label:"McKenzie Hip",icon:"🍑",tag:"mckenzie_hip_chain",source:"McKenzie R. 'Treat Your Own Hip'"},
  {id:"mck_ankle",label:"McKenzie Ankle/Foot",icon:"🦶",tag:"mckenzie_ankle_chain",source:"McKenzie ankle/foot rehabilitation"},
];

const YOGA_LEVELS = [{id:"beginner",label:"BASIC",color:C.success},{id:"intermediate",label:"MODERATE",color:C.warning},{id:"advanced",label:"ADVANCED",color:C.danger}];
const YOGA_TARGETS = ["All","back","hips","shoulders","legs","full_body","core"];

export default function ExtraWork({workout,onAddExercises,onClose}){
  const[openSection,setOpenSection]=useState(null);
  const[selected,setSelected]=useState({});
  const[yogaLevel,setYogaLevel]=useState("all");
  const[yogaTarget,setYogaTarget]=useState("All");
  const injuries=getInjuries().filter(i=>i.status!=="resolved");
  const mainIds=new Set((workout?.all||[]).map(e=>e.id));

  const toggleEx=(id)=>setSelected(p=>({...p,[id]:!p[id]}));
  const selectedCount=Object.values(selected).filter(Boolean).length;
  const selectedExercises=exerciseDB.filter(e=>selected[e.id]);
  const estTime=selectedCount*3; // ~3 min per add-on exercise

  // McKenzie protocol exercises
  const getProtocol=(tag)=>exerciseDB.filter(e=>(e.tags||[]).includes(tag)).sort((a,b)=>(a.progressionChain?.level||0)-(b.progressionChain?.level||0));

  // Yoga exercises with filtering
  const yogaExercises=useMemo(()=>{
    let pool=exerciseDB.filter(e=>(e.tags||[]).includes("yoga"));
    if(yogaLevel!=="all")pool=pool.filter(e=>e._yogaLevel===yogaLevel);
    if(yogaTarget!=="All")pool=pool.filter(e=>e._yogaTarget===yogaTarget);
    return pool;
  },[yogaLevel,yogaTarget]);

  // Foam rolling for today
  const foamRolls=exerciseDB.filter(e=>e.category==="foam_roll"&&!mainIds.has(e.id)).slice(0,8);

  // PT exercises from conditions
  const ptExercises=useMemo(()=>{
    const recs=new Set();
    injuries.forEach(inj=>{
      const cond=conditionsDB.find(c=>c.condition===inj.conditionId||c.name===inj.area);
      if(cond)(cond.recommended||[]).forEach(id=>recs.add(id));
    });
    return exerciseDB.filter(e=>recs.has(e.id)&&!mainIds.has(e.id)).slice(0,10);
  },[injuries,mainIds]);

  // Bodyweight fundamentals
  const bodyweight=exerciseDB.filter(e=>e.category==="main"&&(e.equipmentRequired||[]).every(eq=>eq==="none"||eq==="mat")&&(e.phaseEligibility||[]).includes(1)&&!mainIds.has(e.id)).slice(0,8);

  // Breathing
  const breathing=exerciseDB.filter(e=>(e.tags||[]).some(t=>t.includes("breathing")||t.includes("parasympathetic"))).slice(0,4);

  const ExRow=({ex,disabled})=>(
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${C.border}`,opacity:disabled?0.35:1}}>
      <button onClick={()=>!disabled&&toggleEx(ex.id)} style={{width:20,height:20,borderRadius:4,border:`2px solid ${selected[ex.id]?C.teal:C.border}`,background:selected[ex.id]?C.teal:"transparent",cursor:disabled?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        {selected[ex.id]&&<span style={{color:"#000",fontSize:10,fontWeight:800}}>✓</span>}
      </button>
      <ExerciseImage exercise={ex} size="thumb"/>
      <div style={{flex:1}}>
        <div style={{fontSize:11,fontWeight:600,color:disabled?C.textDim:C.text}}>{ex.name}</div>
        <div style={{fontSize:8,color:C.textDim}}>{(ex.bodyPart||"").replace(/_/g," ")}{ex._yogaLevel&&<>{" · "}<Badge color={ex._yogaLevel==="beginner"?C.success:ex._yogaLevel==="intermediate"?C.warning:C.danger}>{ex._yogaLevel==="beginner"?"BASIC":ex._yogaLevel==="intermediate"?"MODERATE":"ADVANCED"}</Badge></>}</div>
      </div>
      {disabled&&<span style={{fontSize:7,color:C.orange}}>Locked</span>}
    </div>
  );

  const Section=({id,icon,label,badge,exercises,children})=>{
    const isOpen=openSection===id;
    const sectionExercises = exercises || [];
    return(<Card style={{padding:0,overflow:"hidden"}}>
      <div onClick={()=>setOpenSection(isOpen?null:id)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",cursor:"pointer"}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:16}}>{icon}</span><span style={{fontSize:12,fontWeight:700,color:C.text}}>{label}</span>{badge}</div>
        <span style={{color:C.textDim,fontSize:10,transform:isOpen?"rotate(90deg)":"rotate(0)",transition:"transform 0.2s"}}>▸</span>
      </div>
      {isOpen&&<div style={{padding:"0 14px 14px"}}>
        {children}
        {sectionExercises.length > 0 && <button onClick={() => {
          // Add all section exercises and navigate to workout flow
          const toAdd = sectionExercises.filter(e => !mainIds.has(e.id));
          if (toAdd.length > 0 && onAddExercises) onAddExercises(toAdd);
        }} style={{width:"100%",padding:"10px",borderRadius:10,background:`linear-gradient(135deg,${C.teal},${C.tealDark||"#00a89f"})`,border:"none",color:"#000",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>Start {label} ({sectionExercises.length} exercises) →</button>}
      </div>}
    </Card>);
  };

  return(<div style={{display:"flex",flexDirection:"column",gap:10}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div><div style={{fontSize:22,fontWeight:800,color:C.teal,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:3}}>EXTRA WORK</div>
        <div style={{fontSize:10,color:C.textMuted}}>Add-ons go AFTER your main workout. {selectedCount>0&&<span style={{color:C.teal}}>{selectedCount} selected · ~{estTime} min</span>}</div></div>
      <button onClick={onClose} style={{background:"none",border:"none",color:C.textMuted,fontSize:11,cursor:"pointer"}}>← Back</button>
    </div>

    {/* McKenzie Protocols */}
    {PROTOCOLS.map(proto=>{
      const exercises=getProtocol(proto.tag);
      if(!exercises.length)return null;
      const selInProto=exercises.filter(e=>selected[e.id]).length;
      return(<Section key={proto.id} id={proto.id} icon={proto.icon} label={proto.label} exercises={exercises} badge={selInProto>0&&<Badge color={C.teal}>{selInProto}/{exercises.length}</Badge>}>
        <div style={{fontSize:8,color:C.warning,padding:"6px 0",borderBottom:`1px solid ${C.border}`,fontStyle:"italic"}}>{MCK_NOTE}</div>
        <div style={{fontSize:7,color:C.textDim,padding:"4px 0"}}>Source: {proto.source}</div>
        {exercises.map((ex,i)=>{
          const isFlexion=proto.flexionStart&&i>=proto.flexionStart-1;
          const prevDone=i===0||selected[exercises[i-1]?.id];
          const disabled=isFlexion&&!exercises.slice(0,proto.flexionStart-1).every(e=>selected[e.id]);
          return(<div key={ex.id}>
            <div style={{display:"flex",alignItems:"center",gap:4,marginTop:6}}>
              <Badge color={disabled?C.textDim:C.teal}>Step {i+1}/{exercises.length}</Badge>
              {isFlexion&&<Badge color={C.warning}>FLEXION</Badge>}
            </div>
            <ExRow ex={ex} disabled={disabled}/>
            {disabled&&<div style={{fontSize:7,color:C.orange,paddingLeft:28}}>Complete extension steps first</div>}
          </div>);
        })}
      </Section>);
    })}

    {/* Yoga & Mobility */}
    <Section id="yoga" icon="🧘" label="Yoga & Mobility Flows" badge={<Badge color={C.purple}>{yogaExercises.length} poses</Badge>}>
      <div style={{display:"flex",gap:4,marginBottom:8}}>
        {[{id:"all",l:"All",c:C.teal},...YOGA_LEVELS].map(lv=>(
          <button key={lv.id} onClick={()=>setYogaLevel(lv.id)} style={{padding:"4px 8px",borderRadius:6,fontSize:8,fontWeight:700,cursor:"pointer",
            background:yogaLevel===lv.id?(lv.color||lv.c)+"15":"transparent",border:`1px solid ${yogaLevel===lv.id?(lv.color||lv.c):C.border}`,color:yogaLevel===lv.id?(lv.color||lv.c):C.textDim}}>{lv.label||lv.l}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:3,marginBottom:8,flexWrap:"wrap"}}>
        {YOGA_TARGETS.map(t=>(
          <button key={t} onClick={()=>setYogaTarget(t)} style={{padding:"3px 6px",borderRadius:4,fontSize:7,fontWeight:600,cursor:"pointer",
            background:yogaTarget===t?C.purple+"15":"transparent",border:`1px solid ${yogaTarget===t?C.purple:C.border}`,color:yogaTarget===t?C.purple:C.textDim}}>{t==="All"?"All":t.replace(/_/g," ")}</button>
        ))}
      </div>
      {yogaExercises.map(ex=><ExRow key={ex.id} ex={ex}/>)}
    </Section>

    {/* Foam Rolling */}
    <Section id="foam" icon="🧽" label="Extra Foam Rolling" exercises={foamRolls} badge={<Badge>{foamRolls.length}</Badge>}>
      <div style={{fontSize:9,color:C.textMuted,marginBottom:6}}>Based on today's trained muscles and soreness.</div>
      {foamRolls.map(ex=><ExRow key={ex.id} ex={ex}/>)}
    </Section>

    {/* PT Exercises */}
    {ptExercises.length>0&&<Section id="pt" icon="🩺" label="Additional PT Exercises" exercises={ptExercises} badge={<Badge color={C.danger}>{ptExercises.length}</Badge>}>
      <div style={{fontSize:9,color:C.textMuted,marginBottom:6}}>From your active condition protocols — not already in today's workout.</div>
      {ptExercises.map(ex=><ExRow key={ex.id} ex={ex}/>)}
    </Section>}

    {/* Bodyweight */}
    <Section id="bw" icon="💪" label="Bodyweight Fundamentals" badge={<Badge>{bodyweight.length}</Badge>}>
      {bodyweight.map(ex=><ExRow key={ex.id} ex={ex}/>)}
    </Section>

    {/* Breathing */}
    <Section id="breath" icon="🫁" label="Breathing & Recovery" badge={<Badge color={C.info}>{breathing.length}</Badge>}>
      {breathing.map(ex=><ExRow key={ex.id} ex={ex}/>)}
    </Section>

    {/* Add button */}
    {selectedCount>0&&<div style={{position:"sticky",bottom:76,background:C.bg,padding:"10px 0",zIndex:50}}>
      <button onClick={()=>onAddExercises(selectedExercises)} style={{width:"100%",padding:"14px 24px",borderRadius:14,background:`linear-gradient(135deg,${C.teal},#00a89f)`,color:"#000",fontWeight:700,fontSize:14,cursor:"pointer",border:"none",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <span>➕</span> Add {selectedCount} Exercise{selectedCount!==1?"s":""} (~{estTime} min)
      </button>
    </div>}
    <div style={{height:90}}/>
  </div>);
}
