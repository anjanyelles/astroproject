import{j as e,r}from"./index.DA30vlOK.js";import"./index.B_HUrG1y.js";function i({icon:a,title:s,children:n}){return e.jsx(r.Card,{color:"transparent",shadow:!1,children:e.jsxs(r.CardBody,{className:"grid justify-center text-center",children:[a,e.jsx(r.Typography,{variant:"h5",color:"blue-gray",className:"mb-2 !font-semibold",children:s}),e.jsx(r.Typography,{color:"blue-gray",className:"px-8 font-normal text-gray-700",children:n})]})})}const t=[{icon:e.jsx("img",{className:"w-32 mx-auto mb-4",src:"icon1.png"}),title:"Study Plans:",description:"We create personalized study schedules based on your needs."},{icon:e.jsx("img",{className:"w-32 mx-auto mb-4",src:"icon2.png"}),title:"University Admissions:",description:"Expert help in choosing and applying to universities."},{icon:e.jsx("img",{className:"w-32 mx-auto mb-4",src:"icon3.png"}),title:"Career Counseling:",description:"Career Counseling: Guidance to help you choose the right career path."}];function l(){return e.jsxs("section",{className:"px-4 mt-12",children:[e.jsx("div",{className:"container mx-auto mb-20 text-center"}),e.jsx("div",{className:"container mx-auto grid grid-cols-1 gap-y-20 md:grid-cols-2 lg:grid-cols-3",children:t.map(({icon:a,title:s,description:n})=>e.jsx(i,{icon:a,title:s,children:n},s))})]})}export{l as default};