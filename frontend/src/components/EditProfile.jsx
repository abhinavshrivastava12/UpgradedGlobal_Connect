
// import React, { useContext, useRef, useState } from "react";
// import { RxCross1 } from "react-icons/rx";
// import { FiPlus, FiCamera } from "react-icons/fi";
// import axios from "axios";
// import dp from "../assets/dp.webp";
// import { userDataContext } from "../context/userContext";
// import { authDataContext } from "../context/AuthContext";

// function EditProfile() {
//   const { edit, setEdit, userData, setUserData } = useContext(userDataContext);
//   const { serverUrl } = useContext(authDataContext);

//   const [firstName, setFirstName] = useState(userData.firstName || "");
//   const [lastName, setLastName] = useState(userData.lastName || "");
//   const [userName, setUserName] = useState(userData.userName || "");
//   const [headline, setHeadline] = useState(userData.headline || "");
//   const [location, setLocation] = useState(userData.location || "");
//   const [gender, setGender] = useState(userData.gender || "");
//   const [skills, setSkills] = useState(userData.skills || []);
//   const [newSkills, setNewSkills] = useState("");
//   const [education, setEducation] = useState(userData.education || []);
//   const [newEducation, setNewEducation] = useState({
//     college: "",
//     degree: "",
//     fieldOfStudy: "",
//   });
//   const [experience, setExperience] = useState(userData.experience || []);
//   const [newExperience, setNewExperience] = useState({
//     title: "",
//     company: "",
//     description: "",
//   });

//   const [frontendProfileImage, setFrontendProfileImage] = useState(
//     userData.profileImage || dp
//   );
//   const [backendProfileImage, setBackendProfileImage] = useState(null);
//   const [frontendCoverImage, setFrontendCoverImage] = useState(
//     userData.coverImage || null
//   );
//   const [backendCoverImage, setBackendCoverImage] = useState(null);
//   const [saving, setSaving] = useState(false);

//   const profileImage = useRef();
//   const coverImage = useRef();

//   const addSkill = (e) => {
//     e.preventDefault();
//     if (newSkills && !skills.includes(newSkills)) {
//       setSkills([...skills, newSkills]);
//     }
//     setNewSkills("");
//   };

//   const removeSkill = (skill) => {
//     setSkills(skills.filter((s) => s !== skill));
//   };

//   const addEducation = (e) => {
//     e.preventDefault();
//     if (
//       newEducation.college &&
//       newEducation.degree &&
//       newEducation.fieldOfStudy
//     ) {
//       setEducation([...education, newEducation]);
//     }
//     setNewEducation({ college: "", degree: "", fieldOfStudy: "" });
//   };

//   const removeEducation = (edu) => {
//     setEducation(education.filter((e) => e !== edu));
//   };

//   const addExperience = (e) => {
//     e.preventDefault();
//     if (
//       newExperience.title &&
//       newExperience.company &&
//       newExperience.description
//     ) {
//       setExperience([...experience, newExperience]);
//     }
//     setNewExperience({ title: "", company: "", description: "" });
//   };

//   const removeExperience = (exp) => {
//     setExperience(experience.filter((e) => e !== exp));
//   };

//   const handleProfileImage = (e) => {
//     let file = e.target.files[0];
//     setBackendProfileImage(file);
//     setFrontendProfileImage(URL.createObjectURL(file));
//   };

//   const handleCoverImage = (e) => {
//     let file = e.target.files[0];
//     setBackendCoverImage(file);
//     setFrontendCoverImage(URL.createObjectURL(file));
//   };

//   const handleSaveProfile = async () => {
//     setSaving(true);
//     try {
//       let formdata = new FormData();
//       formdata.append("firstName", firstName);
//       formdata.append("lastName", lastName);
//       formdata.append("userName", userName);
//       formdata.append("headline", headline);
//       formdata.append("location", location);
//       formdata.append("skills", JSON.stringify(skills));
//       formdata.append("education", JSON.stringify(education));
//       formdata.append("experience", JSON.stringify(experience));

//       if (backendProfileImage) {
//         formdata.append("profileImage", backendProfileImage);
//       }
//       if (backendCoverImage) {
//         formdata.append("coverImage", backendCoverImage);
//       }

//       let result = await axios.put(
//         serverUrl + "/api/user/updateprofile",
//         formdata,
//         { withCredentials: true }
//       );
//       setUserData(result.data);
//       setSaving(false);
//       setEdit(false);
//     } catch (error) {
//       console.log(error);
//       setSaving(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center">
//       {/* Background overlay */}
//       <div
//         className="absolute inset-0 bg-black bg-opacity-50"
//         onClick={() => setEdit(false)}
//       ></div>

//       {/* Hidden file inputs */}
//       <input
//         type="file"
//         accept="image/*"
//         hidden
//         ref={profileImage}
//         onChange={handleProfileImage}
//       />
//       <input
//         type="file"
//         accept="image/*"
//         hidden
//         ref={coverImage}
//         onChange={handleCoverImage}
//       />

//       {/* Modal */}
//       <div className="relative z-50 w-[90%] max-w-[500px] h-[90vh] bg-white shadow-lg rounded-lg overflow-y-auto p-5">
//         {/* Close button */}
//         <button
//           className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-200"
//           onClick={() => setEdit(false)}
//         >
//           <RxCross1 className="w-6 h-6 text-gray-800" />
//         </button>

//         {/* Cover image */}
//         <div
//           className="relative w-full h-40 bg-gray-300 rounded-lg overflow-hidden group cursor-pointer"
//           onClick={() => coverImage.current.click()}
//         >
//           {frontendCoverImage && (
//             <img
//               src={frontendCoverImage}
//               alt="cover"
//               className="w-full h-full object-cover"
//             />
//           )}
//           <FiCamera className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-2xl opacity-80 group-hover:opacity-100" />
//         </div>

//         {/* Profile image */}
//         <div
//           className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg -mt-10 ml-5 cursor-pointer"
//           onClick={() => profileImage.current.click()}
//         >
//           <img
//             src={frontendProfileImage}
//             alt="profile"
//             className="w-full h-full object-cover"
//           />
//           <div className="absolute bottom-0 right-0 bg-blue-500 p-1 rounded-full">
//             <FiPlus className="text-white" />
//           </div>
//         </div>

//         {/* Form */}
//         <div className="mt-6 space-y-4">
//           {[
//             { placeholder: "First Name", value: firstName, setter: setFirstName },
//             { placeholder: "Last Name", value: lastName, setter: setLastName },
//             { placeholder: "Username", value: userName, setter: setUserName },
//             { placeholder: "Headline", value: headline, setter: setHeadline },
//             { placeholder: "Location", value: location, setter: setLocation },
//             { placeholder: "Gender (male/female/other)", value: gender, setter: setGender },
//           ].map((field, idx) => (
//             <input
//               key={idx}
//               type="text"
//               placeholder={field.placeholder}
//               value={field.value}
//               onChange={(e) => field.setter(e.target.value)}
//               className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
//             />
//           ))}

//           {/* Skills Section */}
//           <SectionCard title="Skills">
//             {skills.map((skill, index) => (
//               <SkillTag key={index} skill={skill} onRemove={removeSkill} />
//             ))}
//             <AddField
//               placeholder="Add new skill"
//               value={newSkills}
//               onChange={setNewSkills}
//               onAdd={addSkill}
//             />
//           </SectionCard>

//           {/* Education Section */}
//           <SectionCard title="Education">
//             {education.map((edu, index) => (
//               <ListItem key={index} data={edu} onRemove={() => removeEducation(edu)} />
//             ))}
//             <MultiAddField
//               fields={[
//                 { placeholder: "College", value: newEducation.college, setter: (v) => setNewEducation({ ...newEducation, college: v }) },
//                 { placeholder: "Degree", value: newEducation.degree, setter: (v) => setNewEducation({ ...newEducation, degree: v }) },
//                 { placeholder: "Field of Study", value: newEducation.fieldOfStudy, setter: (v) => setNewEducation({ ...newEducation, fieldOfStudy: v }) },
//               ]}
//               onAdd={addEducation}
//             />
//           </SectionCard>

//           {/* Experience Section */}
//           <SectionCard title="Experience">
//             {experience.map((exp, index) => (
//               <ListItem key={index} data={exp} onRemove={() => removeExperience(exp)} />
//             ))}
//             <MultiAddField
//               fields={[
//                 { placeholder: "Title", value: newExperience.title, setter: (v) => setNewExperience({ ...newExperience, title: v }) },
//                 { placeholder: "Company", value: newExperience.company, setter: (v) => setNewExperience({ ...newExperience, company: v }) },
//                 { placeholder: "Description", value: newExperience.description, setter: (v) => setNewExperience({ ...newExperience, description: v }) },
//               ]}
//               onAdd={addExperience}
//             />
//           </SectionCard>

//           {/* Save Button */}
//           <button
//             onClick={handleSaveProfile}
//             disabled={saving}
//             className="w-full p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
//           >
//             {saving ? "Saving..." : "Save Profile"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* Helper Components */
// function SectionCard({ title, children }) {
//   return (
//     <div className="p-4 border border-gray-200 rounded-lg space-y-3">
//       <h1 className="font-semibold text-lg">{title}</h1>
//       {children}
//     </div>
//   );
// }

// function SkillTag({ skill, onRemove }) {
//   return (
//     <div className="flex justify-between items-center p-2 bg-gray-100 rounded-lg">
//       <span>{skill}</span>
//       <RxCross1
//         onClick={() => onRemove(skill)}
//         className="w-4 h-4 text-gray-700 cursor-pointer"
//       />
//     </div>
//   );
// }

// function ListItem({ data, onRemove }) {
//   return (
//     <div className="flex justify-between items-start p-2 bg-gray-100 rounded-lg">
//       <div className="text-sm space-y-1">
//         {Object.entries(data).map(([key, value]) => (
//           <div key={key} className="capitalize">
//             {key}: {value}
//           </div>
//         ))}
//       </div>
//       <RxCross1
//         onClick={onRemove}
//         className="w-4 h-4 text-gray-700 cursor-pointer"
//       />
//     </div>
//   );
// }

// function AddField({ placeholder, value, onChange, onAdd }) {
//   return (
//     <div className="space-y-2">
//       <input
//         type="text"
//         placeholder={placeholder}
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
//       />
//       <button
//         onClick={onAdd}
//         className="w-full p-2 border border-blue-400 text-blue-400 rounded-full hover:bg-blue-50"
//       >
//         Add
//       </button>
//     </div>
//   );
// }

// function MultiAddField({ fields, onAdd }) {
//   return (
//     <div className="space-y-2">
//       {fields.map((f, idx) => (
//         <input
//           key={idx}
//           type="text"
//           placeholder={f.placeholder}
//           value={f.value}
//           onChange={(e) => f.setter(e.target.value)}
//           className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
//         />
//       ))}
//       <button
//         onClick={onAdd}
//         className="w-full p-2 border border-blue-400 text-blue-400 rounded-full hover:bg-blue-50"
//       >
//         Add
//       </button>
//     </div>
//   );
// }



// export default EditProfile;





import React, { useContext, useRef, useState } from "react";
import { RxCross1 } from "react-icons/rx";
import { FiPlus, FiCamera } from "react-icons/fi";
import axios from "axios";
import dp from "../assets/dp.webp";
import { userDataContext } from "../context/UserContext";
import { authDataContext } from "../context/AuthContext";

function EditProfile() {
  const { edit, setEdit, userData, setUserData } = useContext(userDataContext);
  const { serverUrl } = useContext(authDataContext);

  const [firstName, setFirstName] = useState(userData.firstName || "");
  const [lastName, setLastName] = useState(userData.lastName || "");
  const [userName, setUserName] = useState(userData.userName || "");
  const [headline, setHeadline] = useState(userData.headline || "");
  const [location, setLocation] = useState(userData.location || "");
  const [gender, setGender] = useState(userData.gender || "");
  const [skills, setSkills] = useState(userData.skills || []);
  const [newSkills, setNewSkills] = useState("");
  const [education, setEducation] = useState(userData.education || []);
  const [newEducation, setNewEducation] = useState({
    college: "",
    degree: "",
    fieldOfStudy: "",
  });
  const [experience, setExperience] = useState(userData.experience || []);
  const [newExperience, setNewExperience] = useState({
    title: "",
    company: "",
    description: "",
  });

  const [frontendProfileImage, setFrontendProfileImage] = useState(
    userData.profileImage || dp
  );
  const [backendProfileImage, setBackendProfileImage] = useState(null);
  const [frontendCoverImage, setFrontendCoverImage] = useState(
    userData.coverImage || null
  );
  const [backendCoverImage, setBackendCoverImage] = useState(null);
  const [saving, setSaving] = useState(false);

  const profileImage = useRef();
  const coverImage = useRef();

  const addSkill = (e) => {
    e.preventDefault();
    if (newSkills && !skills.includes(newSkills)) {
      setSkills([...skills, newSkills]);
    }
    setNewSkills("");
  };

  const removeSkill = (skill) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const addEducation = (e) => {
    e.preventDefault();
    if (
      newEducation.college &&
      newEducation.degree &&
      newEducation.fieldOfStudy
    ) {
      setEducation([...education, newEducation]);
    }
    setNewEducation({ college: "", degree: "", fieldOfStudy: "" });
  };

  const removeEducation = (edu) => {
    setEducation(education.filter((e) => e !== edu));
  };

  const addExperience = (e) => {
    e.preventDefault();
    if (
      newExperience.title &&
      newExperience.company &&
      newExperience.description
    ) {
      setExperience([...experience, newExperience]);
    }
    setNewExperience({ title: "", company: "", description: "" });
  };

  const removeExperience = (exp) => {
    setExperience(experience.filter((e) => e !== exp));
  };

  const handleProfileImage = (e) => {
    let file = e.target.files[0];
    setBackendProfileImage(file);
    setFrontendProfileImage(URL.createObjectURL(file));
  };

  const handleCoverImage = (e) => {
    let file = e.target.files[0];
    setBackendCoverImage(file);
    setFrontendCoverImage(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      let formdata = new FormData();
      formdata.append("firstName", firstName);
      formdata.append("lastName", lastName);
      formdata.append("userName", userName);
      formdata.append("headline", headline);
      formdata.append("location", location);
      formdata.append("skills", JSON.stringify(skills));
      formdata.append("education", JSON.stringify(education));
      formdata.append("experience", JSON.stringify(experience));

      if (backendProfileImage) formdata.append("profileImage", backendProfileImage);
      if (backendCoverImage) formdata.append("coverImage", backendCoverImage);

      let result = await axios.put(
        serverUrl + "/api/user/updateprofile",
        formdata,
        { withCredentials: true }
      );
      setUserData(result.data);
      setSaving(false);
      setEdit(false);
    } catch (error) {
      console.log(error);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Background overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={() => setEdit(false)}
      ></div>

      {/* Hidden file inputs */}
      <input
        type="file"
        accept="image/*"
        hidden
        ref={profileImage}
        onChange={handleProfileImage}
      />
      <input
        type="file"
        accept="image/*"
        hidden
        ref={coverImage}
        onChange={handleCoverImage}
      />

      {/* Modal */}
      <div className="relative z-50 w-[90%] max-w-[600px] h-[90vh] bg-[#1A1F71] shadow-2xl rounded-2xl overflow-y-auto p-5 text-white">
        {/* Close button */}
        <button
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-700 transition"
          onClick={() => setEdit(false)}
        >
          <RxCross1 className="w-6 h-6 text-white" />
        </button>

        {/* Cover image */}
        <div
          className="relative w-full h-40 rounded-lg overflow-hidden cursor-pointer group"
          onClick={() => coverImage.current.click()}
        >
          {frontendCoverImage && (
            <img
              src={frontendCoverImage}
              alt="cover"
              className="w-full h-full object-cover"
            />
          )}
          <FiCamera className="absolute right-4 top-1/2 transform -translate-y-1/2 text-yellow-400 text-2xl opacity-80 group-hover:opacity-100" />
        </div>

        {/* Profile image */}
        <div
          className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-yellow-400 shadow-lg -mt-10 ml-5 cursor-pointer"
          onClick={() => profileImage.current.click()}
        >
          <img
            src={frontendProfileImage}
            alt="profile"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 right-0 bg-yellow-400 p-1 rounded-full">
            <FiPlus className="text-white" />
          </div>
        </div>

        {/* Form */}
        <div className="mt-6 space-y-4">
          {[
            { placeholder: "First Name", value: firstName, setter: setFirstName },
            { placeholder: "Last Name", value: lastName, setter: setLastName },
            { placeholder: "Username", value: userName, setter: setUserName },
            { placeholder: "Headline", value: headline, setter: setHeadline },
            { placeholder: "Location", value: location, setter: setLocation },
            { placeholder: "Gender", value: gender, setter: setGender },
          ].map((field, idx) => (
            <input
              key={idx}
              type="text"
              placeholder={field.placeholder}
              value={field.value}
              onChange={(e) => field.setter(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#2C2C2C] text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          ))}

          {/* Skills Section */}
          <SectionCard title="Skills" color="yellow">
            {skills.map((skill, index) => (
              <SkillTag key={index} skill={skill} onRemove={removeSkill} color="yellow" />
            ))}
            <AddField
              placeholder="Add new skill"
              value={newSkills}
              onChange={setNewSkills}
              onAdd={addSkill}
              color="yellow"
            />
          </SectionCard>

          {/* Education Section */}
          <SectionCard title="Education" color="yellow">
            {education.map((edu, index) => (
              <ListItem key={index} data={edu} onRemove={() => removeEducation(edu)} color="yellow" />
            ))}
            <MultiAddField
              fields={[
                { placeholder: "College", value: newEducation.college, setter: (v) => setNewEducation({ ...newEducation, college: v }) },
                { placeholder: "Degree", value: newEducation.degree, setter: (v) => setNewEducation({ ...newEducation, degree: v }) },
                { placeholder: "Field of Study", value: newEducation.fieldOfStudy, setter: (v) => setNewEducation({ ...newEducation, fieldOfStudy: v }) },
              ]}
              onAdd={addEducation}
              color="yellow"
            />
          </SectionCard>

          {/* Experience Section */}
          <SectionCard title="Experience" color="yellow">
            {experience.map((exp, index) => (
              <ListItem key={index} data={exp} onRemove={() => removeExperience(exp)} color="yellow" />
            ))}
            <MultiAddField
              fields={[
                { placeholder: "Title", value: newExperience.title, setter: (v) => setNewExperience({ ...newExperience, title: v }) },
                { placeholder: "Company", value: newExperience.company, setter: (v) => setNewExperience({ ...newExperience, company: v }) },
                { placeholder: "Description", value: newExperience.description, setter: (v) => setNewExperience({ ...newExperience, description: v }) },
              ]}
              onAdd={addExperience}
              color="yellow"
            />
          </SectionCard>

          {/* Save Button */}
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full p-3 bg-yellow-400 text-[#1A1F71] font-bold rounded-full hover:scale-105 transition"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* Helper Components with premium colors */
function SectionCard({ title, children, color }) {
  return (
    <div className="p-4 rounded-lg bg-[#2C2C2C] space-y-3 border border-gray-600">
      <h1 className={`font-semibold text-lg text-${color}-400`}>{title}</h1>
      {children}
    </div>
  );
}

function SkillTag({ skill, onRemove, color }) {
  return (
    <div className={`flex justify-between items-center p-2 bg-[#1F2561] rounded-lg`}>
      <span>{skill}</span>
      <RxCross1 onClick={() => onRemove(skill)} className={`w-4 h-4 cursor-pointer text-${color}-400`} />
    </div>
  );
}

function ListItem({ data, onRemove, color }) {
  return (
    <div className="flex justify-between items-start p-2 bg-[#1F2561] rounded-lg">
      <div className="text-sm space-y-1">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="capitalize text-white">
            {key}: {value}
          </div>
        ))}
      </div>
      <RxCross1 onClick={onRemove} className={`w-4 h-4 cursor-pointer text-${color}-400`} />
    </div>
  );
}

function AddField({ placeholder, value, onChange, onAdd, color }) {
  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 rounded-lg bg-[#2C2C2C] text-white placeholder-gray-300 focus:ring-2 focus:ring-yellow-400 outline-none"
      />
      <button
        onClick={onAdd}
        className={`w-full p-2 rounded-full border border-yellow-400 text-yellow-400 hover:bg-yellow-50`}
      >
        Add
      </button>
    </div>
  );
}

function MultiAddField({ fields, onAdd, color }) {
  return (
    <div className="space-y-2">
      {fields.map((f, idx) => (
        <input
          key={idx}
          type="text"
          placeholder={f.placeholder}
          value={f.value}
          onChange={(e) => f.setter(e.target.value)}
          className="w-full p-2 rounded-lg bg-[#2C2C2C] text-white placeholder-gray-300 focus:ring-2 focus:ring-yellow-400 outline-none"
        />
      ))}
      <button
        onClick={onAdd}
        className={`w-full p-2 rounded-full border border-yellow-400 text-yellow-400 hover:bg-yellow-50`}
      >
        Add
      </button>
    </div>
  );
}

export default EditProfile;
