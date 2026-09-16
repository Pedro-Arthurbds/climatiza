import { Router } from "express";
import {
  atualizar as atualizarEndereco,
  criar as criarEndereco,
  remover as removerEndereco,
} from "../controllers/address.controller";
import {
  atualizar,
  buscar,
  criar,
  desativar,
  listar,
} from "../controllers/client.controller";
import { autenticar, exigirAdmin } from "../middlewares/auth";
import { asyncHandler } from "../middlewares/errorHandler";

const router = Router();

router.use(autenticar);

// Leitura: ADMIN e TECNICO.
router.get("/", asyncHandler(listar));
router.get("/:id", asyncHandler(buscar));

// Escrita: só ADMIN (cadastro/edição de cliente é tarefa administrativa).
router.post("/", exigirAdmin, asyncHandler(criar));
router.patch("/:id", exigirAdmin, asyncHandler(atualizar));
router.delete("/:id", exigirAdmin, asyncHandler(desativar));

router.post("/:clienteId/enderecos", exigirAdmin, asyncHandler(criarEndereco));

export default router;

// Rotas de endereço que não dependem do clienteId na URL (edição/remoção
// direta) ficam num router separado, registrado em /enderecos.
export const enderecoRouter = Router();
enderecoRouter.use(autenticar, exigirAdmin);
enderecoRouter.patch("/:id", asyncHandler(atualizarEndereco));
enderecoRouter.delete("/:id", asyncHandler(removerEndereco));
