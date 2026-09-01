const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const artworks = [
  {userName:"Niabot",userId:"niabot",userIdUrl:"https://commons.wikimedia.org/wiki/User:Niabot",illustId:"mahuri",illustIdUrl:"https://commons.wikimedia.org/wiki/File:Mahuri.jpg",title:"Mahuri",imageObjectUrl:chrome.runtime.getURL("promo-art/mahuri.jpg"),profileImageUrl:chrome.runtime.getURL("icons/icon-128.png")},
  {userName:"Kasuga",userId:"kasuga",userIdUrl:"https://commons.wikimedia.org/wiki/User:Kasuga~commonswiki",illustId:"wikipe-tan",illustIdUrl:"https://commons.wikimedia.org/wiki/File:Wikipe-tan_full_length.png",title:"Wikipe-tan",imageObjectUrl:chrome.runtime.getURL("promo-art/wikipe-tan.png"),profileImageUrl:chrome.runtime.getURL("icons/icon-128.png")}
];
export function createPromoRuntime(){let index=0;return{async send(message){if(message?.action!=="artwork.get")return null;await wait(index===0?1800:900);const artwork=artworks[index%artworks.length];index+=1;return artwork;}}}
