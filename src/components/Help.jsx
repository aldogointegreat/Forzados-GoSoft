import React, { useState } from "react";

export default function Help({ imagePath, description }) {
	const [help, setHelp] = useState(false);

	const toggleModal = () => {
		setHelp(!help);
	};

	if (help) {
		document.body.classList.add("active-modal");
	} else {
		document.body.classList.remove("active-modal");
	}

	return (
		<React.Fragment>
			<div className="relative group inline-block">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth={1.5}
					stroke="currentColor"
					className="cursor-pointer size-6"
					onClick={toggleModal}
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
					/>
				</svg>

				<span className="absolute left-7 top-1/2 -translate-y-1/2 bg-gray-500 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {description}
				</span>
			</div>

			{help && (
				<div className="modal z-50">
					<div className="overlay" onClick={toggleModal}></div>
					<div className="modal-content">
						<img
							src={imagePath}
							alt="Detalle"
							className="max-w-full max-h-[90vh] mx-auto"
						/>
						<button onClick={toggleModal} className="close-modal text-white rounded">
							X
						</button>
					</div>
				</div>
			)}
		</React.Fragment>
	);
}
