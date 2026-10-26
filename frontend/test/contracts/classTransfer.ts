import { openClassDetails } from "@/obr/openClassDetails";

const classId = Number(
  new URLSearchParams(window.location.search).get("contractClass"),
);
const button = document.createElement("button");
button.textContent = "Open private class from Owlbear";
button.addEventListener("click", () => {
  void openClassDetails(classId);
});
document.body.replaceChildren(button);
