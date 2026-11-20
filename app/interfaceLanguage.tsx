import {createContext,useContext,type ReactNode} from 'react';
const translations:Record<string,string>={
 'Mimi，抱着书、会眨眼和说话的立体小猫':'Mimi, a blinking and talking 3D reading cat',
 'Mimi，会眨眼和说话的动画白猫，书页朝向自己':'Mimi, an animated white cat holding a book facing herself',
 'Mimi 马上就来…':'Mimi is loading…',
 '暂时无法显示 Mimi，仍然可以听故事。':'Mimi could not load. You can still listen to the story.',
 '重新显示 Mimi':'Reload Mimi',
};
const Language=createContext({t:(text:string)=>text});
export function InterfaceLanguageProvider({children,language='zh-CN'}:{children:ReactNode;language?:string}){
 return <Language.Provider value={{t:(text)=>language==='en'?translations[text]??text:text}}>{children}</Language.Provider>;
}
export const useInterfaceLanguage=()=>useContext(Language);
