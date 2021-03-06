class Users::UserAccountController < ApplicationController
  before_action :authenticate_user!, except: :finish_signup
  before_action :set_current_user,   except: :finish_signup

  def edit
  end

  def update
    if @user.update(user_params)
      redirect_to root_path, notice: 'User updated'
    else
      render :edit
    end
  end

  def finish_signup
    if request.patch? && params[:user]
      @user = User.find(params[:id])

      if @user.update(user_params)
        sign_in(@user, bypass: true)
        redirect_to root_path, notice: 'Profile updated.'
      else
        redirect_to finish_signup_path, error: @user.errors
      end
    end
  end

  private

    def set_current_user
      @user = current_user
    end

    def user_params
      accessible = [ :first_name, :last_name, :email, :organization, :organization_role]
      accessible << [ :password, :password_confirmation ] unless params[:user][:password].blank?
      params.require(:user).permit(accessible)
    end
end
