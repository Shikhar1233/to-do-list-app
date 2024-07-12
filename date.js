

exports.day = ()=>{
    const today = new Date();
    const options = {
        weekday: "long",
        year: "2-digit",
        month: "short",
        day: "numeric",
        // timeZone : "",
        // timeZoneName : "long"
    };
    return today.toLocaleDateString("en-GB", options);
};