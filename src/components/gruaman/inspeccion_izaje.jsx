import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/permiso_trabajo.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const secciones = [
	{
		elemento: "BC1. Balde para concreto",
		campos: [
			{ name: "marca_bc1", label: "Marca" },
			{ name: "serial_bc1", label: "Serial" },
			{ name: "capacidad_bc1", label: "Capacidad" },
		],
		preguntas: [
			"¿Manija y ojo para izaje completos y en buen estado?",
			"¿Mecanismo de apertura/cierre: ¿manija, tapa de cierre y seguro se encuentran completos y en buen estado?",
			"Soldaduras: ¿se encuentran completas, sin grietas o desprendimientos?",
			"Estructura: ¿la estructura del balde se evidencia en buen estado sin deformaciones y en buenas condiciones?",
			"Se encuentra en buenas condiciones de aseo, libre de restos de concreto u otro material.",
		],
	},
	{
		elemento: "BC2. Balde para concreto",
		campos: [
			{ name: "marca_bc2", label: "Marca" },
			{ name: "serial_bc2", label: "Serial" },
			{ name: "capacidad_bc2", label: "Capacidad" },
		],
		preguntas: [
			"¿Manija y ojo para izaje completos y en buen estado?",
			"¿Mecanismo de apertura/cierre: ¿manija, tapa de cierre y seguro se encuentran completos y en buen estado?",
			"Soldaduras: ¿se encuentran completas, sin grietas o desprendimientos?",
			"Estructura: ¿la estructura del balde se evidencia en buen estado sin deformaciones y en buenas condiciones?",
			"Se encuentra en buenas condiciones de aseo, libre de restos de concreto u otro material.",
		],
	},
	{
		elemento: "BE1. Balde para escombro",
		campos: [
			{ name: "marca_be1", label: "Marca" },
			{ name: "serial_be1", label: "Serial" },
			{ name: "capacidad_be1", label: "Capacidad" },
		],
		preguntas: [
			"¿Manija y ojo para izaje completos y en buen estado?",
			"¿Mecanismo de apertura/cierre completo y funcionando correctamente?",
			"Soldaduras: ¿se encuentran completas, sin grietas o desprendimientos?",
			"Estructura: ¿la estructura del balde se evidencia en buen estado sin deformaciones y en buenas condiciones?",
		],
	},
	{
		elemento: "CM1. Canasta para material",
		campos: [
			{ name: "marca_cm1", label: "Marca" },
			{ name: "serial_cm1", label: "Serial" },
			{ name: "capacidad_cm1", label: "Capacidad" },
		],
		preguntas: [
			"¿Eslingas de cadena con eslabones secundarios y principales completos y en buen estado?",
			"¿Estructura y malla de seguridad completas y en buenas condiciones?",
			"¿Espadas en buenas condiciones con topes de seguridad móvil y/o fijo completos?",
			"Soldaduras: ¿se encuentran completas, sin grietas o desprendimientos?",
		],
	},
	{
		elemento: "EC1. Eslinga de Cadena",
		campos: [
			{ name: "no_ec1", label: "No." },
			{ name: "capacidad_ec1", label: "Capacidad" },
		],
		preguntas: [
			"¿Ramales con eslabones secundarios y principal completos y en buen estado?",
			"¿Grilletes completos sin deformaciones y en buen estado?",
			"¿Tornillos de grilletes sin desgaste excesivo, completos y en buenas condiciones?",
		],
	},
	{
		elemento: "ES1: Eslinga sintética",
		campos: [
			{ name: "serial_es1", label: "Serial No." },
			{ name: "capacidad_es1", label: "Capacidad" },
		],
		preguntas: [
			"¿Se encuentra en buen estado el textil, sin signos de desgaste, decoloración o quemaduras?",
			"¿Las costuras se encuentran en buen estado, no están rotas o debilitidas?",
			"¿Cuenta con etiqueta en buen estado, es legible y se encuentra en buenas condiciones?",
		],
	},
	{
		elemento: "Grilletes",
		campos: [
			{ name: "serial_grillete", label: "Serial" },
			{ name: "capacidad_grillete", label: "Capacidad" },
		],
		preguntas: [
			"¿Cuenta con deformaciones, fisuras, corrosión o desgaste en el cuerpo del grillete?",
			"¿Los pernos o pasadores que aseguran el grillete están en buen estado, se aseguran y ajustan de manera adecuada?",
		],
	},
];

function getCurrentWeekKey() {
	const now = new Date();
	const firstJan = new Date(now.getFullYear(), 0, 1);
	const days = Math.floor((now - firstJan) / (24 * 60 * 60 * 1000));
	const week = Math.ceil((days + firstJan.getDay() + 1) / 7);
	return `${now.getFullYear()}-W${week}`;
}
function isSunday() {
	return new Date().getDay() === 0;
}

/**
 * InspeccionIzaje — formulario de inspección de equipos de izaje para Gruaman.
 * Inspecciona baldes de concreto, baldes de escombros, canastas de materiales y aparejos.
 * Persiste las respuestas semanalmente en localStorage; las limpia los domingos.
 * Envía mediante POST a /gruaman/inspeccion_izaje al guardar.
 *
 * @param {Object}   props
 * @param {Object}   [props.value={}]   Respuestas pre-cargadas.
 * @param {Function} [props.onChange]   Se llama con las respuestas actualizadas en cada cambio.
 */
function InspeccionIzaje({ value = {}, onChange }) {
	const [respuestas, setRespuestas] = useState(value);
	const [generales, setGenerales] = useState({
		cliente_constructora: "",
		modelo_grua: "",
		proyecto_constructora: "",
		altura_gancho: "",
		fecha_final: "",
		nombre_operador: "",
		cargo: "",
	});
	const [errores, setErrores] = useState({});
	const guardarBtnRef = useRef(null);
	const navigate = useNavigate();

	useEffect(() => {
		const weekKey = getCurrentWeekKey();
		const saved = localStorage.getItem("inspeccion_izaje_respuestas");
		let shouldClear = false;

		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				if (isSunday() || parsed.weekKey !== weekKey) {
					shouldClear = true;
				} else {
					setRespuestas(parsed.respuestas || {});
					setGenerales(parsed.generales || {
						cliente_constructora: "",
						modelo_grua: "",
						proyecto_constructora: "",
						altura_gancho: "",
						fecha_final: "",
						nombre_operador: "",
						cargo: "",
					});
				}
			} catch {
				shouldClear = true;
			}
		}
		if (shouldClear) {
			localStorage.removeItem("inspeccion_izaje_respuestas");
			setRespuestas({});
			setGenerales({
				cliente_constructora: "",
				modelo_grua: "",
				proyecto_constructora: "",
				altura_gancho: "",
				fecha_final: "",
				nombre_operador: "",
				cargo: "",
			});
		}
	}, []);

	useEffect(() => {
		const nombre_proyecto = localStorage.getItem("obra") || localStorage.getItem("nombre_proyecto") || "";
		const nombre_operador = localStorage.getItem("nombre_trabajador") || "";
		const fechaHoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
		const cargo = localStorage.getItem("cargo_trabajador") || "";

		axios.get(`${API_BASE_URL}/obras`)
			.then(res => {
				let obras = [];
				if (Array.isArray(res.data.obras)) {
					obras = res.data.obras;
				}
				const obra_seleccionada = obras.find(o => o.nombre_obra === nombre_proyecto);
				const constructora = obra_seleccionada ? obra_seleccionada.constructora : "";
				setGenerales((prev) => ({
					...prev,
					cliente_constructora: constructora,
					proyecto_constructora: nombre_proyecto,
					nombre_operador: nombre_operador,
					fecha_final: fechaHoy,
					cargo: cargo,
				}));
			})
			.catch(() => {
				setGenerales((prev) => ({
					...prev,
					cliente_constructora: "",
					proyecto_constructora: nombre_proyecto,
					nombre_operador: nombre_operador,
					fecha_final: fechaHoy,
					cargo: cargo,
				}));
			});
	}, []);

	const handleRespuesta = (key, val) => {
		const nuevas = { ...respuestas, [key]: val };
		setRespuestas(nuevas);
		if (onChange) onChange(nuevas);
		setErrores((prev) => ({ ...prev, [key]: false }));
	};

	const handleGeneralesChange = (e) => {
		setGenerales(prev => ({ ...prev, [e.target.name]: e.target.value }));
		setErrores((prev) => ({ ...prev, [e.target.name]: false }));
	};

	const scrollToItem = (id) => {
		const el = document.getElementById(id);
		if (el) {
			el.scrollIntoView({ behavior: "smooth", block: "center" });
			el.focus?.();
		}
	};

	const scrollToGuardar = () => {
		if (guardarBtnRef.current) {
			guardarBtnRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
			guardarBtnRef.current.focus?.();
		}
	};

	const mapRespuestasToPayload = () => ({
		// Datos generales
		nombre_cliente: generales.cliente_constructora,
		nombre_proyecto: generales.proyecto_constructora,
		fecha_servicio: generales.fecha_final,
		nombre_operador: generales.nombre_operador,
		cargo: generales.cargo,
		modelo_grua: generales.modelo_grua,
		altura_gancho: generales.altura_gancho,

		// BALDE PARA CONCRETO 1
		marca_balde_concreto1: respuestas.marca_bc1 || "",
		serial_balde_concreto1: respuestas.serial_bc1 || "",
		capacidad_balde_concreto1: respuestas.capacidad_bc1 || "",
		balde_concreto1_buen_estado: respuestas.sec0_preg0 || "",
		balde_concreto1_mecanismo_apertura: respuestas.sec0_preg1 || "",
		balde_concreto1_soldadura: respuestas.sec0_preg2 || "",
		balde_concreto1_estructura: respuestas.sec0_preg3 || "",
		balde_concreto1_aseo: respuestas.sec0_preg4 || "",

		// BALDE PARA CONCRETO 2
		marca_balde_concreto2: respuestas.marca_bc2 || "",
		serial_balde_concreto2: respuestas.serial_bc2 || "",
		capacidad_balde_concreto2: respuestas.capacidad_bc2 || "",
		balde_concreto2_buen_estado: respuestas.sec1_preg0 || "",
		balde_concreto2_mecanismo_apertura: respuestas.sec1_preg1 || "",
		balde_concreto2_soldadura: respuestas.sec1_preg2 || "",
		balde_concreto2_estructura: respuestas.sec1_preg3 || "",
		balde_concreto2_aseo: respuestas.sec1_preg4 || "",

		// BALDE PARA ESCOMBRO
		marca_balde_escombro: respuestas.marca_be1 || "",
		serial_balde_escombro: respuestas.serial_be1 || "",
		capacidad_balde_escombro: respuestas.capacidad_be1 || "",
		balde_escombro_buen_estado: respuestas.sec2_preg0 || "",
		balde_escombro_mecanismo_apertura: respuestas.sec2_preg1 || "",
		balde_escombro_soldadura: respuestas.sec2_preg2 || "",
		balde_escombro_estructura: respuestas.sec2_preg3 || "",

		// CANASTA PARA MATERIAL
		marca_canasta_material: respuestas.marca_cm1 || "",
		serial_canasta_material: respuestas.serial_cm1 || "",
		capacidad_canasta_material: respuestas.capacidad_cm1 || "",
		canasta_material_buen_estado: respuestas.sec3_preg0 || "",
		canasta_material_malla_seguridad_intacta: respuestas.sec3_preg1 || "",
		canasta_material_espadas: respuestas.sec3_preg2 || "",
		canasta_material_soldadura: respuestas.sec3_preg3 || "",

		// ESLINGA DE CADENA
		numero_eslinga_cadena: respuestas.no_ec1 || "",
		capacidad_eslinga_cadena: respuestas.capacidad_ec1 || "",
		eslinga_cadena_ramales: respuestas.sec4_preg0 || "",
		eslinga_cadena_grilletes: respuestas.sec4_preg1 || "",
		eslinga_cadena_tornillos: respuestas.sec4_preg2 || "",

		// ESLINGA SINTÉTICA
		serial_eslinga_sintetica: respuestas.serial_es1 || "",
		capacidad_eslinga_sintetica: respuestas.capacidad_es1 || "",
		eslinga_sintetica_textil: respuestas.sec5_preg0 || "",
		eslinga_sintetica_costuras: respuestas.sec5_preg1 || "",
		eslinga_sintetica_etiquetas: respuestas.sec5_preg2 || "",

		// GRILLETES
		serial_grillete: respuestas.serial_grillete || "",
		capacidad_grillete: respuestas.capacidad_grillete || "",
		grillete_perno_danos: respuestas.sec6_preg0 || "",
		grillete_cuerpo_buen_estado: respuestas.sec6_preg1 || "",

		// Observaciones generales
		observaciones: respuestas.observaciones || "",
	});

	const handleSubmit = async (e) => {
		e.preventDefault();
		const payload = mapRespuestasToPayload();

		const erroresTemp = {};
		let primerError = null;

		// Validación de datos generales obligatorios
		// "cliente_constructora" se omite: puede quedar vacío si la red falla al cargar /obras,
		[
			"proyecto_constructora",
			"fecha_final",
			"nombre_operador",
			"cargo"
		].forEach((campo) => {
			if (!generales[campo] || !generales[campo].trim()) {
				erroresTemp[campo] = true;
				if (!primerError) primerError = campo;
			}
		});

		// Validación de preguntas
		for (let sidx = 0; sidx < secciones.length; sidx++) {
			for (let pidx = 0; pidx < secciones[sidx].preguntas.length; pidx++) {
				const key = `sec${sidx}_preg${pidx}`;
				const val = respuestas[key];
				if (!val || !["SI", "NO", "NA"].includes(val)) {
					erroresTemp[key] = true;
					if (!primerError) primerError = key;
				}
			}
		}

		setErrores(erroresTemp);

		if (primerError) {
			if (primerError.startsWith("sec")) {
				scrollToItem(primerError);
			} else {
				scrollToItem(`campo_${primerError}`);
			}
			return;
		}

		try {
			// Eliminar el campo si existe en el payload por compatibilidad
			if ('grillete_identificacion_legible' in payload) {
				delete payload.grillete_identificacion_legible;
			}
			await axios.post(`${API_BASE_URL}/gruaman/inspeccion_izaje`, payload);
					const weekKey = getCurrentWeekKey();
			localStorage.setItem(
				"inspeccion_izaje_respuestas",
				JSON.stringify({
					weekKey,
					respuestas,
					generales,
				})
			);
					alert("Lista de inspección enviada correctamente.");
			if (onChange) onChange({});
			setRespuestas({});
			navigate(-1);
		} catch (err) {
			if (err?.response?.data?.faltantes?.includes('grillete_identificacion_legible')) {
				alert("El campo 'grillete_identificacion_legible' fue eliminado y no es necesario. Contacta al administrador para actualizar el backend.");
			} else {
				alert("Error al enviar la lista de chequeo. Verifica que todos los campos obligatorios estén completos y los datos sean válidos.");
			}
		}
	};

	return (
		<form className="form-container" onSubmit={handleSubmit}>
			{/* Datos Generales */}
			<div className="card-section" style={{ marginBottom: 16 }}>
				<h3 className="card-title" style={{ marginBottom: 12 }}>
					Datos Generales
				</h3>
				<div style={{ display: "flex", flexWrap: "wrap", gap: 16}}>
					{[
						{ name: "cliente_constructora", label: "Cliente / Constructora" },
						{ name: "proyecto_constructora", label: "Proyecto / Constructora" },
						{ name: "fecha_final", label: "Fecha Final", type: "date" },
						{ name: "nombre_operador", label: "Trabajador autorizado" },
						{ name: "cargo", label: "Cargo" },
                        { name: "modelo_grua", label: "Modelo de Grúa" },
                        { name: "altura_gancho", label: "Altura bajo gancho" },
					].map((item) => (
						<div key={item.name} style={{ flex: 1, minWidth: 180 }}>
							<label className="label">{item.label}</label>
							<input
								id={`campo_${item.name}`}
								type={item.type || "text"}
								name={item.name}
								value={generales[item.name]}
								onChange={handleGeneralesChange}
								className={`permiso-trabajo-input${errores[item.name] ? " campo-error" : ""}`}
								readOnly={item.name === "cliente_constructora" || item.name === "proyecto_constructora" || item.name === "nombre_operador"}
								style={errores[item.name] ? { borderColor: "red", background: "#ffeaea" } : {}}
							/>
							{errores[item.name] && (
								<span style={{ color: "red", fontSize: 13 }}>
									Este campo es obligatorio.
									<span
										style={{
											marginLeft: 8,
											cursor: "pointer",
											fontSize: 18,
											verticalAlign: "middle"
										}}
										onClick={scrollToGuardar}
										title="Ir al botón Guardar"
									>
										&#8594;
									</span>
								</span>
							)}
						</div>
					))}
				</div>
			</div>

			{/* Secciones de elementos de izaje */}
			{secciones.map((sec, sidx) => (
				<div className="card-section" key={sidx} style={{ marginBottom: 16 }}>
					<h4 className="card-title">{sec.elemento}</h4>
					<div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 12 }}>
						{sec.campos.map((campo) => (
							<div key={campo.name} style={{ flex: 1, minWidth: 140 }}>
								<label className="permiso-trabajo-label">{campo.label}</label>
								<input
									name={campo.name}
									placeholder={campo.label}
									value={respuestas[campo.name] || ""}
									onChange={(e) => handleRespuesta(campo.name, e.target.value)}
									className="permiso-trabajo-input"
								/>
							</div>
						))}
					</div>
					{sec.preguntas.map((pregunta, pidx) => {
						const key = `sec${sidx}_preg${pidx}`;
						return (
							<div key={pidx} style={{ marginBottom: 8 }}>
								<div className="permiso-trabajo-label">{pregunta}</div>
								<div style={{ display: "flex", alignItems: "center" }}>
									<select
										id={key}
										name={key}
										value={respuestas[key] || ""}
										onChange={(e) => handleRespuesta(key, e.target.value)}
										className={`permiso-trabajo-select${errores[key] ? " campo-error" : ""}`}
										style={errores[key] ? { borderColor: "red", background: "#ffeaea", minWidth: 120, maxWidth: 220 } : { minWidth: 120, maxWidth: 220 }}
									>
										<option value="">--</option>
										<option value="SI">SI</option>
										<option value="NO">NO</option>
										<option value="NA">NA</option>
									</select>
									{errores[key] && (
										<span
											style={{
												color: "red",
												fontSize: 16,
												marginLeft: 8,
												cursor: "pointer",
												verticalAlign: "middle"
											}}
											onClick={scrollToGuardar}
											title="Ir al botón Guardar"
										>
											&#8594;
										</span>
									)}
								</div>
							</div>
						);
					})}
				</div>
			))}

			{/* Observaciones */}
			<div className="card-section">
				<label className="permiso-trabajo-label">OBSERVACIONES</label>
				<div style={{ width: "100%", boxSizing: "border-box", paddingRight: 2 }}>
					<textarea
						className="permiso-trabajo-textarea"
						style={{ width: "100%", minHeight: 60, boxSizing: "border-box" }}
						value={respuestas.observaciones || ""}
						onChange={(e) => handleRespuesta("observaciones", e.target.value)}
					/>
				</div>
			</div>

			{/* Firma */}
			<div className="card-section">
				<label className="permiso-trabajo-label">
					FIRMA TRABAJADOR AUTORIZADO / CONSTANCIA DE VERIFICACIÓN
				</label>
				<input
					type="text"
					className="permiso-trabajo-input"
					placeholder="Nombre y/o firma"
					value={respuestas.firma || ""}
					onChange={(e) => handleRespuesta("firma", e.target.value)}
				/>
			</div>

			<div style={{ textAlign: "right", marginTop: 24 }}>
				<button
					type="submit"
					className="button"
					style={{ background: "#ff9800", color: "#fff" }}
					ref={guardarBtnRef}
				>
					Guardar
				</button>
			</div>
		</form>
	);
}

export default InspeccionIzaje;
