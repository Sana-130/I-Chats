const router= async()=>{
    const routes=[
    {path:'*/', view:()=> console.log("viewing blah")}
    ];


    const potential_matches=routes.map(route=>{
        return{
            route:route,
            isMatch:location.pathname==route.path
        }
    })

    document.addEventListener("DOMContentLoaded", ()=>{
        router()
    })

    let match=potential_matches.find(potential_match =>potential_match.isMatch);

    
}