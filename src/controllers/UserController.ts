import { Request, Response } from 'express';
import { v4 as uuidv4, NIL as NIL_UUID } from 'uuid';
import supabase from '../database';
import User from '../beans/User';
import { PostgrestError } from '@supabase/supabase-js';

export default class UserController {
  async get_all(req: Request, res: Response) {
    const { data: users_data, error } = await supabase
      .from('User')
      .select('*') as {
        data: User[], error: PostgrestError | null
      };
    if (error) {
      const msg = "[UserController.register] Error selecting all users";
      return res.status(500).json({ msg, users_data });
    }
    return res.status(200).json({ msg: "sucesso", users_data });
  }

  async register(req: Request, res: Response) {
    const { email, password }: User = req.body;

    // Select repeated emails
    const { data: users_with_equal_email, error: selectError } = await supabase
      .from('User')
      .select(`email`)
      .eq('email', email);
    if (selectError) {
      const msg = "[UserController.register] Error checking email uniqueness";
      return res.status(500)
        .json({ msg, id: NIL_UUID });
    }

    // Check for repeated email
    const isRepeated = users_with_equal_email.length > 0;
    if (isRepeated) {
      const msg = "[UserController.register] Email already in use";
      return res.status(400)
        .json({ msg, id: NIL_UUID });
    }

    // Create new user
    const id = uuidv4()
    const { error: insertError } = await supabase
      .from('User')
      .insert({ id, email, password });
    if (insertError) {
      console.log(insertError);
      const msg = "[UserController.register] Error inserting new user";
      return res.status(500)
        .json({ msg, id: NIL_UUID });
    }

    return res.status(200)
      .json({ msg: 'New user created!', id });
  }

  async login(req: Request, res: Response) {
    const { email, password }: User = req.body;

    // Select existing user
    const { data: existing_user, error: selectError } = await supabase
      .from('User')
      .select(`*`)
      .eq('email', email)
      .eq('password', password);
    if (selectError) {
      return res.status(500)
        .json({ msg: 'Error selecting existing user', id: NIL_UUID });
    }

    // Check for valid credentials
    if (!existing_user) {
      return res.status(401)
        .json({ msg: 'Invalid Email or Password', id: NIL_UUID });
    }
    console.log(existing_user);
    // Se chegou até aqui, significa que o login foi bem-sucedido
    return res.status(200)
      .json({ msg: 'Login bem-sucedido', id: existing_user[0].id });
  }
}
