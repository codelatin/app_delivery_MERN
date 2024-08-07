const bcrypt= require("bcrypt");
const jwt=require("jsonwebtoken");
const Usuario= require("../model/Usuario");
const Generadorotp= require("otp-generator");
const nodemailer=require("nodemailer");

const ControladorRegistro = async(req, res)=>{
    try{
        const ExisteUsuario= await Usuario.findOne({ email: req.body.email});
        if (ExisteUsuario){
            return res.status(200).send({
                message:"Ups este Usuario Ya existe",
                success:false,
            });

        }

        const password =req.body.password;
        const salt = await bcrypt.genSalt(10);
        const hashpassword= await bcrypt.hash(password, salt);
        req.body.password= hashpassword;

            const confirmarPassword= await bcrypt.hash(req.body.confirmarpassword,salt);

            const otp= Generadorotp.generate(6, {
                digits:true,
                upperCase:false,
                specialChars:false,
                upperCaseAlphabets:false,
                lowerCaseAlphabets:false,
            });
            req.body.confirmarpassword= confirmarPassword
            if (req.body.password === req.body.confirmarpassword){
                const NuevoUsuario = new Usuario({
                    nombre:req.body.nombre,
                    email:req.body.email,
                    Imagenperfil: req.body.Imagenperfil,
                    password:req.body.password,
                    confirmarpassword:req.body.confirmarpassword,
                    otp:otp,
                });
                await NuevoUsuario.save();
                const token=jwt.sign({ id:NuevoUsuario._id},process.env.JWT_SECRET,{
                    expiresIn: "1d",
                });
            const transportador=nodemailer.createTransport({
                service: "Gmail",
                auth:{
                    user:"codelatincolombia@gmail.com",
                    pass:"txkxpctycjmsjgdy",
                }
            });

            const opcionesEmail ={
                from: "App Delivery Codelatin-Colombia",
                to:req.body.email,
                subject:"Verificacion De Email Por Otp",
                text:`Tu verificacion otp es ${otp}`,
            };
            transportador.sendMail(opcionesEmail,(error, info) =>{
                if (error){
                    console.log(error);
                    return res.status(500).send("Error al Enviar Email!...");
                }
                res.send({
                    message: "El otp se ha enviado al Email",
                });
            });

             return res.status(201).send({
                message: "Te has Registro Con Exito!",
                data:{
                    user:NuevoUsuario,
                    token,
                },
                success:true,
             }) ;

            } else {
                return res.status(201).send({
                    message:"Las Contraseñas no Coinciden!",

                    success:false,
                });
            } 
    }catch (error){
        console.log(error);
        return res.status(500).send({
            message: "Error al Registrarse",

            success:false,
        });
    }
};

module.exports = {  ControladorRegistro };